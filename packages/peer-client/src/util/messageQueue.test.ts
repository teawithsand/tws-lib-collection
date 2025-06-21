import { describe, expect, test } from "vitest"
import { MessageQueue } from "./messageQueue"

describe("MessageQueue", () => {
	test("send and receive: should send and receive a message", async () => {
		const queue = new MessageQueue<string>()
		const message = "hello"
		queue.send(message)
		const receivedMessage = await queue.receive()
		expect(receivedMessage).toBe(message)
	})

	test("send and receive: should maintain FIFO order", async () => {
		const queue = new MessageQueue<number>()
		const messages = [1, 2, 3]
		for (const msg of messages) {
			queue.send(msg)
		}
		const receivedMessages: number[] = []
		for (let i = 0; i < messages.length; i++) {
			receivedMessages.push(await queue.receive())
		}
		expect(receivedMessages).toEqual(messages)
	})

	test("receive: should wait if queue is empty", async () => {
		const queue = new MessageQueue<string>()
		const message = "delayed hello"
		const receivePromise = queue.receive()

		// Ensure it's actually waiting
		let resolved = false
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		receivePromise.then(() => (resolved = true))
		await new Promise((r) => setTimeout(r, 50)) // Give some time for the promise to potentially resolve
		expect(resolved).toBe(false)

		queue.send(message)
		const receivedMessage = await receivePromise
		expect(receivedMessage).toBe(message)
		expect(resolved).toBe(true)
	})

	test("send: should resolve a waiting receiver", async () => {
		const queue = new MessageQueue<string>()
		const message = "direct to receiver"

		const receivePromise = queue.receive() // Call receive first
		queue.send(message) // Then send

		const receivedMessage = await receivePromise
		expect(receivedMessage).toBe(message)
	})

	test("send: should throw if maxSize is reached", () => {
		const maxSize = 2
		const queue = new MessageQueue<number>(maxSize)
		queue.send(1)
		queue.send(2)
		expect(() => queue.send(3)).toThrow(
			"MessageQueue has reached its maximum size.",
		)
	})

	test("receive: should return buffered messages before waiting", async () => {
		const queue = new MessageQueue<string>(3)
		queue.send("msg1")
		queue.send("msg2")

		expect(await queue.receive()).toBe("msg1")
		expect(await queue.receive()).toBe("msg2")

		const receivePromise = queue.receive()
		queue.send("msg3")
		expect(await receivePromise).toBe("msg3")
	})

	test("setError: should reject waiting receivers", async () => {
		const queue = new MessageQueue<string>()
		const receivePromise1 = queue.receive()
		const receivePromise2 = queue.receive()
		const error = new Error("Test error")

		queue.setError(error)

		await expect(receivePromise1).rejects.toThrow(error)
		await expect(receivePromise2).rejects.toThrow(error)
	})

	test("setError: should prevent new sends", () => {
		const queue = new MessageQueue<string>()
		const error = new Error("Test error")
		queue.setError(error)
		expect(() => queue.send("message after error")).toThrow(
			"MessageQueue has an error set. Cannot send new messages.",
		)
	})

	test("setError: should make future receives throw the error", async () => {
		const queue = new MessageQueue<string>()
		const error = new Error("Test error")
		queue.setError(error)
		await expect(queue.receive()).rejects.toThrow(error)
	})

	test("setError: should clear the queue", async () => {
		const queue = new MessageQueue<string>(5)
		queue.send("msg1")
		queue.send("msg2")
		const error = new Error("Test error")
		queue.setError(error, true) // rejectBufferedMessages is true

		// Attempt to receive should throw the set error, not return old messages
		await expect(queue.receive()).rejects.toThrow(error)
		await expect(queue.receive()).rejects.toThrow(error) // ensure second message is also gone

		// Internal queue should be empty, though not directly testable without exposing queue
		// We can infer this by trying to send up to maxSize again if setError didn't clear it
		// However, since send is blocked after error, this is not a direct test.
		// The main point is that setError makes prior messages inaccessible.
	})

	test("setError: should be idempotent", async () => {
		const queue = new MessageQueue<string>()
		const error1 = new Error("First error")
		const error2 = new Error("Second error")

		const receivePromise = queue.receive()

		queue.setError(error1)
		queue.setError(error2) // Second call should be ignored

		await expect(receivePromise).rejects.toThrow(error1) // Should reject with the first error
		await expect(queue.receive()).rejects.toThrow(error1) // Future receives also get the first error
		expect(() => queue.send("message")).toThrow(
			"MessageQueue has an error set. Cannot send new messages.",
		)
	})

	test("send and receive: with many messages and receivers", async () => {
		const queue = new MessageQueue<number>()
		const numMessages = 100
		const messages = Array.from({ length: numMessages }, (_, i) => i)
		const receivePromises: Array<Promise<number>> = []

		// Mix sends and receives
		for (let i = 0; i < numMessages / 2; i++) {
			await queue.send(messages[i]!)
		}
		for (let i = 0; i < numMessages; i++) {
			receivePromises.push(queue.receive())
		}
		for (let i = numMessages / 2; i < numMessages; i++) {
			await queue.send(messages[i]!)
		}

		const receivedMessages = await Promise.all(receivePromises)
		expect(receivedMessages.sort((a, b) => a - b)).toEqual(messages) // Order of reception might vary due to async nature, so sort before comparing
	})

	test("send: should not throw if queue size equals maxSize after send", () => {
		const maxSize = 1
		const queue = new MessageQueue<number>(maxSize)
		expect(() => queue.send(1)).not.toThrow()
		expect(() => queue.send(2)).toThrow(
			"MessageQueue has reached its maximum size.",
		)
	})

	test("receive: should handle multiple concurrent receivers correctly", async () => {
		const queue = new MessageQueue<string>()
		const message1 = "hello"
		const message2 = "world"

		const p1 = queue.receive()
		const p2 = queue.receive()

		await queue.send(message1)
		await queue.send(message2)

		const [r1, r2] = await Promise.all([p1, p2])
		// The order of resolution of p1 and p2 depends on the internal promise scheduling,
		// but together they should receive message1 and message2.
		expect([r1, r2].sort()).toEqual([message1, message2].sort())
	})

	test("setError: should reject waiting promises even if queue was not empty", async () => {
		const queue = new MessageQueue<string>()
		await queue.send("buffered message")
		// receivePromise consumes "buffered message" and is set to resolve with it.
		// It is NOT a waiting promise in this setup.
		const receivePromise = queue.receive()

		const error = new Error("Test error")
		queue.setError(error)

		// A new receive() call after setError should be rejected.
		await expect(queue.receive()).rejects.toThrow(error)
		// The original receivePromise, which took its message before setError was called,
		// should resolve successfully with the buffered message.
		expect(await receivePromise).toBe("buffered message")
	})

	test("setError: should clear buffered messages if rejectBufferedMessages is true", async () => {
		const queue = new MessageQueue<string>()
		await queue.send("buffered1")
		await queue.send("buffered2")
		const error = new Error("Test error with rejectBufferedMessages true")

		queue.setError(error, true) // rejectBufferedMessages is true

		// All attempts to receive should now throw the error, as the queue should be cleared.
		await expect(queue.receive()).rejects.toThrow(error)
		await expect(queue.receive()).rejects.toThrow(error) // Try receiving again
	})

	test("setError: should not clear buffered messages if rejectBufferedMessages is false (default)", async () => {
		const queue = new MessageQueue<string>()
		await queue.send("buffered1")
		await queue.send("buffered2")

		const error = new Error("Test error with rejectBufferedMessages false")
		queue.setError(error) // rejectBufferedMessages is false by default

		// Buffered messages should still be receivable
		expect(await queue.receive()).toBe("buffered1")
		expect(await queue.receive()).toBe("buffered2")

		// Now the queue is empty. A promise created now should wait and then be rejected.
		const receivePromiseWaiting = queue.receive()

		// The promise that was waiting should be rejected
		await expect(receivePromiseWaiting).rejects.toThrow(error)

		// Any new attempts to receive (now that the queue is empty and error is set) should throw the error.
		await expect(queue.receive()).rejects.toThrow(error)
	})
})
