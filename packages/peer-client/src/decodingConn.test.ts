import { Encoder } from "@teawithsand/reserd"
import { describe, expect, test, vi } from "vitest"
import { DecodingConn } from "./decodingConn"
import { MockConn } from "./util/mockConn"

describe("DecodingConn", () => {
	test("should encode outgoing and decode incoming messages", async () => {
		const [innerConn1, innerConn2] = MockConn.createConnectedPair<string>()

		// Simple encoder that converts objects to JSON strings and back
		const encoder: Encoder<{ message: string }, string> = {
			encode: (raw) => JSON.stringify(raw),
			decode: (encoded) => JSON.parse(encoded),
		}

		const decodingConn = new DecodingConn(innerConn1, encoder)

		// Send object through decoding connection (should be encoded)
		const originalMessage = { message: "hello world" }
		await decodingConn.send(originalMessage)

		// Receive raw encoded message from inner connection
		const encodedMessage = await innerConn2.receive()
		expect(encodedMessage).toBe('{"message":"hello world"}')

		// Send encoded message back through inner connection
		await innerConn2.send(encodedMessage)

		// Receive through decoding connection (should be decoded)
		const decodedMessage = await decodingConn.receive()
		expect(decodedMessage).toEqual(originalMessage)
	})

	test("should handle ArrayBuffer encoding/decoding", async () => {
		const [innerConn1, innerConn2] =
			MockConn.createConnectedPair<ArrayBuffer>()

		// Encoder that converts strings to/from ArrayBuffer
		const encoder: Encoder<string, ArrayBuffer> = {
			encode: (raw) => new TextEncoder().encode(raw).buffer,
			decode: (encoded) => new TextDecoder().decode(encoded),
		}

		const decodingConn = new DecodingConn(innerConn1, encoder)

		// Send string (should be encoded to ArrayBuffer)
		const originalString = "test message"
		await decodingConn.send(originalString)

		// Receive ArrayBuffer from inner connection
		const encodedBuffer = await innerConn2.receive()
		// expect(encodedBuffer).toBeInstanceOf(ArrayBuffer)
		expect(new TextDecoder().decode(encodedBuffer)).toBe(originalString)

		// Send ArrayBuffer back
		await innerConn2.send(encodedBuffer)

		// Receive decoded string
		const decodedString = await decodingConn.receive()
		expect(decodedString).toBe(originalString)
	})

	test("should throw error if encoding fails", async () => {
		const [innerConn1] = MockConn.createConnectedPair<string>()

		// Encoder that throws on encoding
		const encoder: Encoder<object, string> = {
			encode: () => {
				throw new Error("Encoding failed")
			},
			decode: (encoded) => JSON.parse(encoded),
		}

		const decodingConn = new DecodingConn(innerConn1, encoder)

		// Should throw encoding error
		await expect(decodingConn.send({ test: "data" })).rejects.toThrow(
			"Failed to encode message for sending",
		)
	})

	test("should throw error if decoding fails", async () => {
		const [innerConn1, innerConn2] = MockConn.createConnectedPair<string>()

		// Encoder that throws on decoding
		const encoder: Encoder<object, string> = {
			encode: (raw) => JSON.stringify(raw),
			decode: () => {
				throw new Error("Decoding failed")
			},
		}

		const decodingConn = new DecodingConn(innerConn1, encoder)

		// Send invalid data through inner connection
		await innerConn2.send("invalid data")

		// Should throw decoding error
		await expect(decodingConn.receive()).rejects.toThrow(
			"Failed to decode received message",
		)
	})

	test("should forward close calls to inner connection", () => {
		const [innerConn1] = MockConn.createConnectedPair<string>()
		const closeSpy = vi.spyOn(innerConn1, "close")

		const encoder: Encoder<string, string> = {
			encode: (raw) => raw,
			decode: (encoded) => encoded,
		}

		const decodingConn = new DecodingConn(innerConn1, encoder)

		decodingConn.close()

		expect(closeSpy).toHaveBeenCalledOnce()
	})

	test("should handle complex object encoding/decoding", async () => {
		interface ComplexObject {
			id: number
			name: string
			metadata: {
				tags: string[]
				active: boolean
			}
		}

		const [innerConn1, innerConn2] = MockConn.createConnectedPair<string>()

		const encoder: Encoder<ComplexObject, string> = {
			encode: (raw) => JSON.stringify(raw),
			decode: (encoded) => JSON.parse(encoded),
		}

		const decodingConn = new DecodingConn(innerConn1, encoder)

		const complexObject: ComplexObject = {
			id: 123,
			name: "Test Object",
			metadata: {
				tags: ["tag1", "tag2"],
				active: true,
			},
		}

		// Send complex object
		await decodingConn.send(complexObject)

		// Receive encoded version
		const encoded = await innerConn2.receive()
		expect(typeof encoded).toBe("string")

		// Send back through inner connection
		await innerConn2.send(encoded)

		// Receive decoded object
		const decoded = await decodingConn.receive()
		expect(decoded).toEqual(complexObject)
	})

	test("should handle binary data encoding", async () => {
		const [innerConn1, innerConn2] = MockConn.createConnectedPair<string>()

		// Encoder that converts Uint8Array to base64 string and back
		const encoder: Encoder<Uint8Array, string> = {
			encode: (raw) => {
				const binary = Array.from(raw, (byte) =>
					String.fromCharCode(byte),
				).join("")
				return btoa(binary)
			},
			decode: (encoded) => {
				const binary = atob(encoded)
				return new Uint8Array(
					binary.split("").map((char) => char.charCodeAt(0)),
				)
			},
		}

		const decodingConn = new DecodingConn(innerConn1, encoder)

		// Create binary data
		const originalData = new Uint8Array([1, 2, 3, 4, 5])

		// Send binary data (should be encoded to base64)
		await decodingConn.send(originalData)

		// Receive base64 string
		const encodedString = await innerConn2.receive()
		expect(typeof encodedString).toBe("string")

		// Send back through inner connection
		await innerConn2.send(encodedString)

		// Receive decoded binary data
		const decodedData = await decodingConn.receive()
		expect(decodedData).toEqual(originalData)
	})

	test("should propagate inner connection errors", async () => {
		const [innerConn1] = MockConn.createConnectedPair<string>()

		const encoder: Encoder<string, string> = {
			encode: (raw) => raw,
			decode: (encoded) => encoded,
		}

		const decodingConn = new DecodingConn(innerConn1, encoder)

		// Close inner connection
		innerConn1.close()

		// Should propagate receive error
		await expect(decodingConn.receive()).rejects.toThrow(
			"Connection closed",
		)

		// Should propagate send error
		await expect(decodingConn.send("test")).rejects.toThrow(
			"Connection is closed",
		)
	})

	test("should handle multiple sequential messages", async () => {
		const [innerConn1, innerConn2] = MockConn.createConnectedPair<string>()

		const encoder: Encoder<number, string> = {
			encode: (raw) => `num:${raw}`,
			decode: (encoded) => parseInt(encoded.replace("num:", ""), 10),
		}

		const decodingConn = new DecodingConn(innerConn1, encoder)

		// Send multiple numbers
		await decodingConn.send(1)
		await decodingConn.send(2)
		await decodingConn.send(3)

		// Receive encoded versions
		const encoded1 = await innerConn2.receive()
		const encoded2 = await innerConn2.receive()
		const encoded3 = await innerConn2.receive()

		expect(encoded1).toBe("num:1")
		expect(encoded2).toBe("num:2")
		expect(encoded3).toBe("num:3")

		// Send back
		await innerConn2.send(encoded1)
		await innerConn2.send(encoded2)
		await innerConn2.send(encoded3)

		// Receive decoded versions
		const decoded1 = await decodingConn.receive()
		const decoded2 = await decodingConn.receive()
		const decoded3 = await decodingConn.receive()

		expect(decoded1).toBe(1)
		expect(decoded2).toBe(2)
		expect(decoded3).toBe(3)
	})

	test("should work with identity encoder", async () => {
		const [innerConn1, innerConn2] = MockConn.createConnectedPair<string>()

		// Identity encoder (no transformation)
		const encoder: Encoder<string, string> = {
			encode: (raw) => raw,
			decode: (encoded) => encoded,
		}

		const decodingConn = new DecodingConn(innerConn1, encoder)

		const message = "test message"

		// Send through decoding connection
		await decodingConn.send(message)

		// Should receive same message from inner connection
		const received = await innerConn2.receive()
		expect(received).toBe(message)

		// Send back
		await innerConn2.send(received)

		// Should receive same message from decoding connection
		const decoded = await decodingConn.receive()
		expect(decoded).toBe(message)
	})
})
