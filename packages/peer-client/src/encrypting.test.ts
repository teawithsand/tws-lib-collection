import { beforeEach, describe, expect, test, vi } from "vitest"
import { EncryptingConn, EncryptionKeyManager } from "./encrypting"
import { MockConn } from "./util/mockConn"

describe("EncryptionKeyManager", () => {
	test("should generate a valid AES-GCM key", async () => {
		const key = await EncryptionKeyManager.generateKey()

		expect(key).toBeInstanceOf(CryptoKey)
		expect(key.algorithm.name).toBe("AES-GCM")
		expect((key.algorithm as AesKeyAlgorithm).length).toBe(256)
		expect(key.extractable).toBe(true)
		expect(key.usages).toContain("encrypt")
		expect(key.usages).toContain("decrypt")
	})

	test("should export and import key correctly", async () => {
		const originalKey = await EncryptionKeyManager.generateKey()
		const exportedKey = await EncryptionKeyManager.exportKey(originalKey)
		const importedKey = await EncryptionKeyManager.importKey(exportedKey)

		expect(exportedKey).toBeInstanceOf(ArrayBuffer)
		expect(exportedKey.byteLength).toBe(32) // 256 bits = 32 bytes
		expect(importedKey).toBeInstanceOf(CryptoKey)
		expect(importedKey.algorithm.name).toBe("AES-GCM")
		expect((importedKey.algorithm as AesKeyAlgorithm).length).toBe(256)
	})

	test("should handle round-trip key export/import", async () => {
		const key1 = await EncryptionKeyManager.generateKey()
		const exported = await EncryptionKeyManager.exportKey(key1)
		const key2 = await EncryptionKeyManager.importKey(exported)

		// Test that both keys can encrypt/decrypt the same data
		const testData = new TextEncoder().encode("test message")
		const iv = crypto.getRandomValues(new Uint8Array(12))

		const encrypted1 = await crypto.subtle.encrypt(
			{ name: "AES-GCM", iv },
			key1,
			testData,
		)

		const decrypted2 = await crypto.subtle.decrypt(
			{ name: "AES-GCM", iv },
			key2,
			encrypted1,
		)

		expect(new Uint8Array(decrypted2)).toEqual(new Uint8Array(testData))
	})
})

describe("EncryptingConn", () => {
	let key: CryptoKey
	let mockConnPair: [MockConn<ArrayBuffer>, MockConn<ArrayBuffer>]
	let encryptingConn: EncryptingConn
	let plainConn: MockConn<ArrayBuffer>

	beforeEach(async () => {
		key = await EncryptionKeyManager.generateKey()
		mockConnPair = MockConn.createConnectedPair<ArrayBuffer>()
		encryptingConn = new EncryptingConn(mockConnPair[0], { key })
		plainConn = mockConnPair[1]
	})

	test("should encrypt and decrypt messages correctly", async () => {
		const originalMessage = new TextEncoder().encode(
			"Hello, encrypted world!",
		)

		// Send message through encrypting connection
		encryptingConn.send(originalMessage.buffer)

		// Receive encrypted data from plain connection
		const encryptedData = await plainConn.receive()

		// Verify the data is actually encrypted (different from original)
		expect(new Uint8Array(encryptedData)).not.toEqual(
			new Uint8Array(originalMessage.buffer),
		)
		expect(encryptedData.byteLength).toBeGreaterThan(
			originalMessage.byteLength,
		) // IV + encrypted data

		// Send encrypted data back through plain connection
		plainConn.send(encryptedData)

		// Receive and verify decrypted message
		const decryptedMessage = await encryptingConn.receive()
		expect(new Uint8Array(decryptedMessage)).toEqual(
			new Uint8Array(originalMessage.buffer),
		)
	})

	test("should handle empty messages", async () => {
		const emptyMessage = new ArrayBuffer(0)

		encryptingConn.send(emptyMessage)
		const encryptedData = await plainConn.receive()

		// Even empty messages should have IV + encrypted content
		expect(encryptedData.byteLength).toBeGreaterThan(0)

		plainConn.send(encryptedData)
		const decryptedMessage = await encryptingConn.receive()

		expect(decryptedMessage.byteLength).toBe(0)
	})

	test("should handle large messages", async () => {
		const largeMessage = new Uint8Array(1024 * 1024) // 1MB
		for (let i = 0; i < largeMessage.length; i++) {
			largeMessage[i] = i % 256
		}

		encryptingConn.send(largeMessage.buffer)
		const encryptedData = await plainConn.receive()

		plainConn.send(encryptedData)
		const decryptedMessage = await encryptingConn.receive()

		expect(new Uint8Array(decryptedMessage)).toEqual(largeMessage)
	})

	test("should use different IVs for each message", async () => {
		const message = new TextEncoder().encode("test message")

		// Send two identical messages
		encryptingConn.send(message.buffer)
		encryptingConn.send(message.buffer)

		const encrypted1 = await plainConn.receive()
		const encrypted2 = await plainConn.receive()

		// Encrypted data should be different due to different IVs
		expect(new Uint8Array(encrypted1)).not.toEqual(
			new Uint8Array(encrypted2),
		)

		// But both should decrypt to the same original message
		plainConn.send(encrypted1)
		plainConn.send(encrypted2)

		const decrypted1 = await encryptingConn.receive()
		const decrypted2 = await encryptingConn.receive()

		expect(new Uint8Array(decrypted1)).toEqual(
			new Uint8Array(message.buffer),
		)
		expect(new Uint8Array(decrypted2)).toEqual(
			new Uint8Array(message.buffer),
		)
	})

	test("should include 12-byte IV in encrypted data", async () => {
		const message = new TextEncoder().encode("test")

		encryptingConn.send(message.buffer)
		const encryptedData = await plainConn.receive()

		// Encrypted data should be at least IV (12 bytes) + some encrypted content
		expect(encryptedData.byteLength).toBeGreaterThanOrEqual(12)

		// First 12 bytes should be the IV
		const iv = new Uint8Array(encryptedData, 0, 12)
		expect(iv.length).toBe(12)
	})

	test("should throw error for corrupted encrypted data", async () => {
		const message = new TextEncoder().encode("test message")

		encryptingConn.send(message.buffer)
		const encryptedData = await plainConn.receive()

		// Corrupt the encrypted data
		const corruptedData = new Uint8Array(encryptedData)
		if (corruptedData.length > 15) {
			corruptedData[15] = corruptedData[15]! ^ 0xff // Flip bits in encrypted content
		}

		plainConn.send(corruptedData.buffer)

		// Should throw an error when trying to decrypt corrupted data
		await expect(encryptingConn.receive()).rejects.toThrow()
	})

	test("should throw error for data too short to contain IV", async () => {
		const shortData = new Uint8Array(10) // Less than 12 bytes required for IV

		plainConn.send(shortData.buffer)

		await expect(encryptingConn.receive()).rejects.toThrow(
			"Received data is too short to contain valid encrypted message",
		)
	})

	test("should throw error for invalid IV", async () => {
		// Create data with valid length but invalid encryption format
		const invalidData = new Uint8Array(20)
		crypto.getRandomValues(invalidData) // Random data that's not valid encryption

		plainConn.send(invalidData.buffer)

		// Should throw an error when trying to decrypt invalid data
		await expect(encryptingConn.receive()).rejects.toThrow()
	})

	test("should handle send errors gracefully", async () => {
		const consoleSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {})

		// Close the underlying connection to cause send to fail
		mockConnPair[1].close()

		// Send should not throw (it's async and catches errors)
		const message = new TextEncoder().encode("test")
		expect(() => encryptingConn.send(message.buffer)).not.toThrow()

		// Wait a bit for the async operation to complete
		await new Promise((resolve) => setTimeout(resolve, 10))

		// Should have logged an error
		expect(consoleSpy).toHaveBeenCalledWith(
			"Failed to encrypt and send message:",
			expect.any(Error),
		)

		consoleSpy.mockRestore()
	})

	test("should close underlying connection", () => {
		const closeSpy = vi.spyOn(mockConnPair[0], "close")

		encryptingConn.close()

		expect(closeSpy).toHaveBeenCalledOnce()
	})

	test("should handle multiple sequential operations", async () => {
		const messages = [
			new TextEncoder().encode("Message 1"),
			new TextEncoder().encode("Message 2"),
			new TextEncoder().encode("Message 3"),
		]

		// Send all messages
		for (const message of messages) {
			encryptingConn.send(message.buffer)
		}

		// Receive and forward all encrypted messages
		const encryptedMessages: ArrayBuffer[] = []
		for (let i = 0; i < messages.length; i++) {
			const encrypted = await plainConn.receive()
			encryptedMessages.push(encrypted)
			plainConn.send(encrypted)
		}

		// Verify all messages decrypt correctly and in order
		for (let i = 0; i < messages.length; i++) {
			const decrypted = await encryptingConn.receive()
			expect(new Uint8Array(decrypted)).toEqual(
				new Uint8Array(messages[i]!.buffer),
			)
		}
	})

	test("should work with two encrypting connections using same key", async () => {
		// Create two encrypting connections with the same key
		const mockConnPair2 = MockConn.createConnectedPair<ArrayBuffer>()
		const encryptingConn1 = new EncryptingConn(mockConnPair[0], { key })
		const encryptingConn2 = new EncryptingConn(mockConnPair2[1], { key })

		// Connect the plain sides
		const plainConn1 = mockConnPair[1]
		const plainConn2 = mockConnPair2[0]

		const message1 = new TextEncoder().encode("Hello from conn1")
		const message2 = new TextEncoder().encode("Hello from conn2")

		// Send message through first encrypting connection
		encryptingConn1.send(message1.buffer)
		const encrypted1 = await plainConn1.receive()
		plainConn2.send(encrypted1)
		const decrypted1 = await encryptingConn2.receive()

		// Send message through second encrypting connection
		encryptingConn2.send(message2.buffer)
		const encrypted2 = await plainConn2.receive()
		plainConn1.send(encrypted2)
		const decrypted2 = await encryptingConn1.receive()

		expect(new Uint8Array(decrypted1)).toEqual(
			new Uint8Array(message1.buffer),
		)
		expect(new Uint8Array(decrypted2)).toEqual(
			new Uint8Array(message2.buffer),
		)
	})

	test("should fail to decrypt with wrong key", async () => {
		const wrongKey = await EncryptionKeyManager.generateKey()
		const message = new TextEncoder().encode("secret message")

		// Encrypt with original key
		encryptingConn.send(message.buffer)
		const encryptedData = await plainConn.receive()

		// Try to decrypt with wrong key connection
		const [wrongMockConn1, wrongMockConn2] =
			MockConn.createConnectedPair<ArrayBuffer>()
		const wrongKeyEncryptingConn = new EncryptingConn(wrongMockConn1, {
			key: wrongKey,
		})

		wrongMockConn2.send(encryptedData)

		// Should fail to decrypt with wrong key
		await expect(wrongKeyEncryptingConn.receive()).rejects.toThrow()
	})
})
