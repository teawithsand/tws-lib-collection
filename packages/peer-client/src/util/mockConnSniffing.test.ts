import { describe, expect, test } from "vitest"
import { MessageSniffer, MockConnSniffing } from "./mockConnSniffing"

describe("MockConnSniffing", () => {
	test("should create connected pair with shared sniffer", async () => {
		const [conn1, conn2, sniffer] =
			MockConnSniffing.createConnectedPair<string>()

		expect(sniffer.getMessageCount()).toBe(0)

		// Send message from conn1 to conn2
		await conn1.send("hello")
		expect(sniffer.getMessageCount()).toBe(1)
		expect(sniffer.getMessagesFromConnection("conn1")).toEqual(["hello"])
		expect(sniffer.getMessagesFromConnection("conn2")).toEqual([])

		// Receive message on conn2
		const received = await conn2.receive()
		expect(received).toBe("hello")

		// Send message from conn2 to conn1
		await conn2.send("world")
		expect(sniffer.getMessageCount()).toBe(2)
		expect(sniffer.getMessagesFromConnection("conn1")).toEqual(["hello"])
		expect(sniffer.getMessagesFromConnection("conn2")).toEqual(["world"])

		const allMessages = sniffer.getAllMessages()
		expect(allMessages).toEqual([
			{ message: "hello", connectionId: "conn1" },
			{ message: "world", connectionId: "conn2" },
		])

		conn1.close()
		conn2.close()
	})

	test("should create connected pair with separate sniffers", async () => {
		const [conn1, conn2, sniffer1, sniffer2] =
			MockConnSniffing.createConnectedPairWithSeparateSniffers<string>()

		// Send message from conn1 (should be recorded in sniffer1)
		await conn1.send("from-conn1")
		expect(sniffer1.getMessageCount()).toBe(1)
		expect(sniffer2.getMessageCount()).toBe(0)
		expect(sniffer1.getMessagesFromConnection("conn1")).toEqual([
			"from-conn1",
		])

		// Receive on conn2
		const received1 = await conn2.receive()
		expect(received1).toBe("from-conn1")

		// Send message from conn2 (should be recorded in sniffer2)
		await conn2.send("from-conn2")
		expect(sniffer1.getMessageCount()).toBe(1)
		expect(sniffer2.getMessageCount()).toBe(1)
		expect(sniffer2.getMessagesFromConnection("conn2")).toEqual([
			"from-conn2",
		])

		// Receive on conn1
		const received2 = await conn1.receive()
		expect(received2).toBe("from-conn2")

		conn1.close()
		conn2.close()
	})

	test("should provide sniffer access through connection", () => {
		const [conn1, conn2, sharedSniffer] =
			MockConnSniffing.createConnectedPair<string>()

		const conn1Sniffer = conn1.getSniffer()
		const conn2Sniffer = conn2.getSniffer()

		// Both connections should share the same sniffer
		expect(conn1Sniffer).toBe(sharedSniffer)
		expect(conn2Sniffer).toBe(sharedSniffer)
		expect(conn1Sniffer).toBe(conn2Sniffer)

		conn1.close()
		conn2.close()
	})

	test("should store messages separately in each connection", async () => {
		const [conn1, conn2, sniffer] =
			MockConnSniffing.createConnectedPair<string>()

		await conn1.send("msg1")
		await conn1.send("msg2")
		await conn2.send("msg3")

		// Each connection should store its own sent messages
		expect(conn1.getSentMessages()).toEqual(["msg1", "msg2"])
		expect(conn2.getSentMessages()).toEqual(["msg3"])

		// Sniffer should have all messages with connection IDs
		expect(sniffer.getAllMessages()).toEqual([
			{ message: "msg1", connectionId: "conn1" },
			{ message: "msg2", connectionId: "conn1" },
			{ message: "msg3", connectionId: "conn2" },
		])

		conn1.close()
		conn2.close()
	})

	test("should provide connection IDs", () => {
		const [conn1, conn2] = MockConnSniffing.createConnectedPair<string>()

		expect(conn1.getConnectionId()).toBe("conn1")
		expect(conn2.getConnectionId()).toBe("conn2")

		conn1.close()
		conn2.close()
	})
})

describe("MessageSniffer", () => {
	test("should record messages with connection IDs", () => {
		const sniffer = new MessageSniffer<string>()

		sniffer.recordMessage("test1", "conn1")
		sniffer.recordMessage("test2", "conn2")
		sniffer.recordMessage("test3", "conn1")

		expect(sniffer.getMessageCount()).toBe(3)
		expect(sniffer.getMessagesFromConnection("conn1")).toEqual([
			"test1",
			"test3",
		])
		expect(sniffer.getMessagesFromConnection("conn2")).toEqual(["test2"])

		const allMessages = sniffer.getAllMessages()
		expect(allMessages).toEqual([
			{ message: "test1", connectionId: "conn1" },
			{ message: "test2", connectionId: "conn2" },
			{ message: "test3", connectionId: "conn1" },
		])

		const allMessagesBothDirections = sniffer.getAllMessagesBothDirections()
		expect(allMessagesBothDirections).toEqual(["test1", "test2", "test3"])
	})

	test("should clear all messages", () => {
		const sniffer = new MessageSniffer<string>()

		sniffer.recordMessage("test1", "conn1")
		sniffer.recordMessage("test2", "conn2")
		expect(sniffer.getMessageCount()).toBe(2)

		sniffer.clear()
		expect(sniffer.getMessageCount()).toBe(0)
		expect(sniffer.getAllMessages()).toEqual([])
		expect(sniffer.getMessagesFromConnection("conn1")).toEqual([])
	})

	test("should handle empty state", () => {
		const sniffer = new MessageSniffer<string>()

		expect(sniffer.getMessageCount()).toBe(0)
		expect(sniffer.getAllMessages()).toEqual([])
		expect(sniffer.getAllMessagesBothDirections()).toEqual([])
		expect(sniffer.getMessagesFromConnection("any")).toEqual([])
	})
})
