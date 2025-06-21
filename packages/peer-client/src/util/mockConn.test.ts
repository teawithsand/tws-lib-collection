import { describe, expect, test } from "vitest"
import { MockConn } from "./mockConn"

describe("MockConn", () => {
	describe("createConnectedPair", () => {
		test("should create two connected MockConn instances", () => {
			const [conn1, conn2] = MockConn.createConnectedPair<string>()
			expect(conn1).toBeInstanceOf(MockConn)
			expect(conn2).toBeInstanceOf(MockConn)
			expect(conn1).not.toBe(conn2)
		})

		test("should allow messages to be sent and received between paired connections", async () => {
			const [conn1, conn2] = MockConn.createConnectedPair<string>()
			const message1 = "hello from conn1"
			const message2 = "hello from conn2"

			await conn1.send(message1)
			const receivedByConn2 = await conn2.receive()
			expect(receivedByConn2).toBe(message1)

			await conn2.send(message2)
			const receivedByConn1 = await conn1.receive()
			expect(receivedByConn1).toBe(message2)
		})

		test("should respect maxQueueSize", async () => {
			const [conn1, conn2] = MockConn.createConnectedPair<string>(1)
			const message1 = "message 1"
			const message2 = "message 2"

			await conn1.send(message1)
			await expect(conn1.send(message2)).rejects.toThrow(
				"MessageQueue has reached its maximum size.",
			)

			const receivedByConn2 = await conn2.receive()
			expect(receivedByConn2).toBe(message1)

			await conn1.send(message2)
			const receivedByConn2Again = await conn2.receive()
			expect(receivedByConn2Again).toBe(message2)
		})
	})

	describe("send", () => {
		test("should send a message to the output queue", async () => {
			const [conn1, conn2] = MockConn.createConnectedPair<string>()
			const message = "test message"
			await conn1.send(message)
			const receivedMessage = await conn2.receive()
			expect(receivedMessage).toBe(message)
		})

		test("should throw an error if the connection is closed", async () => {
			const [conn1] = MockConn.createConnectedPair<string>()
			conn1.close()
			await expect(conn1.send("test message")).rejects.toThrow(
				"Connection is closed. Cannot send message.",
			)
		})

		test("should close itself and throw if sending to outputQueue fails (e.g. other side closed)", async () => {
			const [conn1, conn2] = MockConn.createConnectedPair<string>()
			conn2.close()
			await expect(conn1.send("test message")).rejects.toThrow(
				"Connection closed",
			)
			await expect(conn1.send("another message")).rejects.toThrow(
				"Connection is closed. Cannot send message.",
			)
		})
	})

	describe("receive", () => {
		test("should receive a message from the input queue", async () => {
			const [conn1, conn2] = MockConn.createConnectedPair<string>()
			const message = "test message"
			await conn2.send(message)
			const receivedMessage = await conn1.receive()
			expect(receivedMessage).toBe(message)
		})

		test("should throw an error if the connection is closed and queue is empty", async () => {
			const [conn1] = MockConn.createConnectedPair<string>()
			conn1.close()
			await expect(conn1.receive()).rejects.toThrow("Connection closed")
		})

		test("should process buffered messages even if connection is closed afterwards", async () => {
			const [conn1, conn2] = MockConn.createConnectedPair<string>()
			const message = "buffered message"
			await conn2.send(message)
			conn1.close()
			const receivedMessage = await conn1.receive()
			expect(receivedMessage).toBe(message)
			await expect(conn1.receive()).rejects.toThrow("Connection closed")
		})

		test("should reject pending receive if connection is closed", async () => {
			const [conn1] = MockConn.createConnectedPair<string>()
			const receivePromise = conn1.receive()
			conn1.close()
			await expect(receivePromise).rejects.toThrow("Connection closed")
		})
	})

	describe("close", () => {
		test("should mark the connection as closed", async () => {
			const [conn1] = MockConn.createConnectedPair<string>()
			conn1.close()
			await expect(conn1.send("test message")).rejects.toThrow(
				"Connection is closed. Cannot send message.",
			)
			await expect(conn1.receive()).rejects.toThrow("Connection closed")
		})

		test("should be idempotent", async () => {
			const [conn1] = MockConn.createConnectedPair<string>()
			conn1.close()
			conn1.close()
			await expect(conn1.send("test message")).rejects.toThrow(
				"Connection is closed. Cannot send message.",
			)
			await expect(conn1.receive()).rejects.toThrow("Connection closed")
		})

		test("should cause the other connections receive to fail", async () => {
			const [conn1, conn2] = MockConn.createConnectedPair<string>()
			conn1.close()
			await expect(conn2.receive()).rejects.toThrow("Connection closed")
		})

		test("should cause the other connections send to fail", async () => {
			const [conn1, conn2] = MockConn.createConnectedPair<string>()
			conn1.close()
			await expect(conn2.send("test")).rejects.toThrow(
				"Connection closed",
			)
		})

		test("should reject pending receives on both ends", async () => {
			const [conn1, conn2] = MockConn.createConnectedPair<string>()

			const receivePromise1 = conn1.receive()
			const receivePromise2 = conn2.receive()

			conn1.close()

			await expect(receivePromise1).rejects.toThrow("Connection closed")
			await expect(receivePromise2).rejects.toThrow("Connection closed")
		})

		test("closing one side should make both sides closed", async () => {
			const [conn1, conn2] = MockConn.createConnectedPair<string>()
			conn1.close()

			await expect(conn1.send("msg to self")).rejects.toThrow(
				"Connection is closed. Cannot send message.",
			)
			await expect(conn1.receive()).rejects.toThrow("Connection closed")

			await expect(conn2.send("msg to conn1")).rejects.toThrow(
				"Connection closed",
			)
			await expect(conn2.receive()).rejects.toThrow("Connection closed")
		})

		test("should allow receiving remaining messages if rejectBufferedMessages is false (default for close)", async () => {
			const [conn1, conn2] = MockConn.createConnectedPair<string>()
			await conn2.send("msg1")
			await conn2.send("msg2")

			const p1 = conn1.receive()

			conn2.close()

			expect(await p1).toBe("msg1")
			expect(await conn1.receive()).toBe("msg2")

			await expect(conn1.receive()).rejects.toThrow("Connection closed")
		})
	})

	describe("concurrent send/receive and close", () => {
		test("should handle messages sent before close correctly", async () => {
			const [conn1, conn2] = MockConn.createConnectedPair<string>()
			await conn1.send("message1")
			await conn2.send("messageA")
			await conn1.send("message2")

			const receivedByConn2First = await conn2.receive()
			expect(receivedByConn2First).toBe("message1")

			conn1.close()

			const receivedByConn1 = await conn1.receive()
			expect(receivedByConn1).toBe("messageA")

			const receivedByConn2Second = await conn2.receive()
			expect(receivedByConn2Second).toBe("message2")

			await expect(conn1.receive()).rejects.toThrow("Connection closed")
			await expect(conn2.receive()).rejects.toThrow("Connection closed")
		})

		test("receive promise should reject if connection closes while waiting", async () => {
			const [conn1, conn2] = MockConn.createConnectedPair<string>()
			const receivePromise = conn1.receive()
			conn2.close()
			await expect(receivePromise).rejects.toThrow("Connection closed")
		})

		test("multiple receives and then close", async () => {
			const [conn1, conn2] = MockConn.createConnectedPair<string>(2)
			const p1_1 = conn1.receive()
			const p1_2 = conn1.receive()

			await conn2.send("m1")
			await conn2.send("m2")

			expect(await p1_1).toBe("m1")
			expect(await p1_2).toBe("m2")

			const p1_3 = conn1.receive()
			conn1.close()
			await expect(p1_3).rejects.toThrow("Connection closed")
		})
	})
})
