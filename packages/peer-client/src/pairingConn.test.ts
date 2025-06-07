import { describe, expect, test, vi } from "vitest"
import { Parser } from "./pairing"
import { PairingConn } from "./pairingConn"
import { MockConn } from "./util/mockConn"

describe("PairingConn", () => {
	test("should parse incoming messages using the provided parser", async () => {
		const [innerConn1, innerConn2] = MockConn.createConnectedPair<string>()

		// Parser that converts string to uppercase
		const parser: Parser<string, string> = (data: string) =>
			data.toUpperCase()

		const pairingConn = new PairingConn(innerConn1, parser)

		// Send a message through the inner connection
		innerConn2.send("hello world")

		// Receive and verify it's parsed
		const received = await pairingConn.receive()
		expect(received).toBe("HELLO WORLD")
	})

	test("should parse JSON messages", async () => {
		const [innerConn1, innerConn2] = MockConn.createConnectedPair<string>()

		// Parser that converts JSON string to object
		const parser: Parser<string, { message: string; count: number }> = (
			data: string,
		) => {
			return JSON.parse(data)
		}

		const pairingConn = new PairingConn(innerConn1, parser)

		// Send JSON string
		const jsonMessage = JSON.stringify({ message: "test", count: 42 })
		innerConn2.send(jsonMessage)

		// Receive and verify it's parsed
		const received = await pairingConn.receive()
		expect(received).toEqual({ message: "test", count: 42 })
	})

	test("should throw error if parsing fails", async () => {
		const [innerConn1, innerConn2] = MockConn.createConnectedPair<string>()

		// Parser that throws on invalid JSON
		const parser: Parser<string, object> = (data: string) => {
			return JSON.parse(data)
		}

		const pairingConn = new PairingConn(innerConn1, parser)

		// Send invalid JSON
		innerConn2.send("invalid json")

		// Should throw parsing error
		await expect(pairingConn.receive()).rejects.toThrow(
			"Failed to parse received message",
		)
	})

	test("should forward send calls to inner connection", () => {
		const [innerConn1] = MockConn.createConnectedPair<string>()
		const sendSpy = vi.spyOn(innerConn1, "send")

		const parser: Parser<string, string> = (data: string) => data
		const pairingConn = new PairingConn(innerConn1, parser)

		pairingConn.send("test message")

		expect(sendSpy).toHaveBeenCalledWith("test message")
	})

	test("should forward close calls to inner connection", () => {
		const [innerConn1] = MockConn.createConnectedPair<string>()
		const closeSpy = vi.spyOn(innerConn1, "close")

		const parser: Parser<string, string> = (data: string) => data
		const pairingConn = new PairingConn(innerConn1, parser)

		pairingConn.close()

		expect(closeSpy).toHaveBeenCalledOnce()
	})

	test("should handle ArrayBuffer to object parsing", async () => {
		const [innerConn1, innerConn2] =
			MockConn.createConnectedPair<ArrayBuffer>()

		// Parser that converts ArrayBuffer to string then to object
		const parser: Parser<ArrayBuffer, { data: string }> = (
			buffer: ArrayBuffer,
		) => {
			const text = new TextDecoder().decode(buffer)
			return JSON.parse(text)
		}

		const pairingConn = new PairingConn(innerConn1, parser)

		// Send ArrayBuffer containing JSON
		const jsonData = JSON.stringify({ data: "test data" })
		const buffer = new TextEncoder().encode(jsonData).buffer
		innerConn2.send(buffer)

		// Receive and verify parsing
		const received = await pairingConn.receive()
		expect(received).toEqual({ data: "test data" })
	})

	test("should handle complex data transformations", async () => {
		const [innerConn1, innerConn2] = MockConn.createConnectedPair<string>()

		// Parser that extracts specific fields and transforms them
		const parser: Parser<
			string,
			{ id: number; name: string; isActive: boolean }
		> = (data: string) => {
			const parts = data.split("|")
			if (parts.length !== 3) {
				throw new Error("Invalid format")
			}
			return {
				id: parseInt(parts[0]!, 10),
				name: parts[1]!,
				isActive: parts[2] === "true",
			}
		}

		const pairingConn = new PairingConn(innerConn1, parser)

		// Send formatted string
		innerConn2.send("123|John Doe|true")

		// Receive and verify transformation
		const received = await pairingConn.receive()
		expect(received).toEqual({
			id: 123,
			name: "John Doe",
			isActive: true,
		})
	})

	test("should propagate receive errors from inner connection", async () => {
		const [innerConn1] = MockConn.createConnectedPair<string>()

		const parser: Parser<string, string> = (data: string) => data
		const pairingConn = new PairingConn(innerConn1, parser)

		// Close inner connection to cause receive error
		innerConn1.close()

		// Should propagate the error
		await expect(pairingConn.receive()).rejects.toThrow("Connection closed")
	})

	test("should handle multiple sequential messages", async () => {
		const [innerConn1, innerConn2] = MockConn.createConnectedPair<string>()

		// Parser that adds a prefix
		const parser: Parser<string, string> = (data: string) =>
			`parsed: ${data}`

		const pairingConn = new PairingConn(innerConn1, parser)

		// Send multiple messages
		innerConn2.send("message1")
		innerConn2.send("message2")
		innerConn2.send("message3")

		// Receive and verify all are parsed
		const received1 = await pairingConn.receive()
		const received2 = await pairingConn.receive()
		const received3 = await pairingConn.receive()

		expect(received1).toBe("parsed: message1")
		expect(received2).toBe("parsed: message2")
		expect(received3).toBe("parsed: message3")
	})
})
