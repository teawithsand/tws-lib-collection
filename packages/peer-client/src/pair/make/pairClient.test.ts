import {
	EncoderUtil,
	JsonEncoder,
	TextBufferEncoder,
} from "@teawithsand/reserd"
import { describe, expect, test, vi } from "vitest"
import { MockConn } from "../../util/mockConn"
import { PairMakeData, PairMakeDataRole, PairMaker } from "./pairClient"

const encoder = EncoderUtil.compose(new JsonEncoder(), new TextBufferEncoder())

const makePairData = ({
	role,
	hostId,
	authSecret,
	ownPublicAddress,
	timeAddressData,
}: {
	role: PairMakeDataRole
	hostId: string
	authSecret: ArrayBuffer
	ownPublicAddress: string
	timeAddressData: any
}): PairMakeData => ({
	authSecret,
	role,
	hostId,
	ownPublicAddress,
	timeAddressData,
})

function arrayBufferEquals(a: ArrayBuffer, b: ArrayBuffer): boolean {
	if (a.byteLength !== b.byteLength) return false
	const va = new Uint8Array(a)
	const vb = new Uint8Array(b)
	for (let i = 0; i < va.length; ++i) {
		if (va[i] !== vb[i]) return false
	}
	return true
}

describe("PairClient", () => {
	test("should successfully pair two clients with matching secrets", async () => {
		const [connA, connB] = MockConn.createConnectedPair<ArrayBuffer>()
		const secret = new Uint8Array([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
		]).buffer
		const hostIdA = "hostA"
		const hostIdB = "hostB"
		const timeAddressData = { foo: "bar" }
		const clientA = new PairMaker({
			conn: connA,
			makeData: makePairData({
				role: PairMakeDataRole.SECRET_OFFERER,
				hostId: hostIdA,
				authSecret: secret,
				ownPublicAddress: "addressA",
				timeAddressData,
			}),
			encoder,
		})
		const clientB = new PairMaker({
			conn: connB,
			makeData: makePairData({
				role: PairMakeDataRole.SECRET_CONSUMER,
				hostId: hostIdB,
				authSecret: secret,
				ownPublicAddress: "addressB",
				timeAddressData,
			}),
			encoder,
		})
		const [resultA, resultB] = await Promise.all([
			clientA.pair(),
			clientB.pair(),
		])
		expect(resultA.local.hostId).toBe(hostIdA)
		expect(resultA.remote.hostId).toBe(hostIdB)
		expect(resultB.local.hostId).toBe(hostIdB)
		expect(resultB.remote.hostId).toBe(hostIdA)
		expect(
			arrayBufferEquals(
				resultA.local.encryptionKey,
				resultB.remote.encryptionKey,
			),
		).toBe(true)
		expect(
			arrayBufferEquals(
				resultB.local.encryptionKey,
				resultA.remote.encryptionKey,
			),
		).toBe(true)
	})

	test("should fail pairing if secrets do not match", async () => {
		const [connA, connB] = MockConn.createConnectedPair<ArrayBuffer>()
		const secretA = new Uint8Array([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
		]).buffer
		const secretB = new Uint8Array([
			16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
		]).buffer
		const hostIdA = "hostA"
		const hostIdB = "hostB"
		const timeAddressData = { foo: "bar" }
		const clientA = new PairMaker({
			conn: connA,
			makeData: makePairData({
				role: PairMakeDataRole.SECRET_OFFERER,
				hostId: hostIdA,
				authSecret: secretA,
				ownPublicAddress: "addressA",
				timeAddressData,
			}),
			encoder,
		})
		const clientB = new PairMaker({
			conn: connB,
			makeData: makePairData({
				role: PairMakeDataRole.SECRET_CONSUMER,
				hostId: hostIdB,
				authSecret: secretB,
				ownPublicAddress: "addressB",
				timeAddressData,
			}),
			encoder,
		})
		await expect(
			Promise.all([clientA.pair(), clientB.pair()]),
		).rejects.toThrow()
	})

	test("should throw a clear error when secrets do not match", async () => {
		const [connA, connB] = MockConn.createConnectedPair<ArrayBuffer>()
		const secretA = new Uint8Array([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
		]).buffer
		const secretB = new Uint8Array([
			16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
		]).buffer
		const hostIdA = "hostA"
		const hostIdB = "hostB"
		const timeAddressData = { foo: "bar" }
		const clientA = new PairMaker({
			conn: connA,
			makeData: makePairData({
				role: PairMakeDataRole.SECRET_OFFERER,
				hostId: hostIdA,
				authSecret: secretA,
				ownPublicAddress: "addressA",
				timeAddressData,
			}),
			encoder,
		})
		const clientB = new PairMaker({
			conn: connB,
			makeData: makePairData({
				role: PairMakeDataRole.SECRET_CONSUMER,
				hostId: hostIdB,
				authSecret: secretB,
				ownPublicAddress: "addressB",
				timeAddressData,
			}),
			encoder,
		})
		let error: unknown = undefined
		try {
			await Promise.all([clientA.pair(), clientB.pair()])
		} catch (e) {
			error = e
		}
		expect(error).toBeDefined()
		const errMsg = String(error)
		expect(
			errMsg.includes("HMAC authentication") ||
				errMsg.includes("failed HMAC") ||
				errMsg.includes("authentication"),
		).toBe(true)
	})

	test("should fail if one side closes connection before pairing", async () => {
		const [connA, connB] = MockConn.createConnectedPair<ArrayBuffer>()
		const secret = new Uint8Array([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
		]).buffer
		const hostIdA = "hostA"
		const hostIdB = "hostB"
		const timeAddressData = { foo: "bar" }
		const clientA = new PairMaker({
			conn: connA,
			makeData: makePairData({
				role: PairMakeDataRole.SECRET_OFFERER,
				hostId: hostIdA,
				authSecret: secret,
				ownPublicAddress: "addressA",
				timeAddressData,
			}),
			encoder,
		})
		const clientB = new PairMaker({
			conn: connB,
			makeData: makePairData({
				role: PairMakeDataRole.SECRET_CONSUMER,
				hostId: hostIdB,
				authSecret: secret,
				ownPublicAddress: "addressB",
				timeAddressData,
			}),
			encoder,
		})
		connA.close()
		await expect(clientA.pair()).rejects.toThrow()
		await expect(clientB.pair()).rejects.toThrow()
	})

	test("should fail if protocol version is tampered", async () => {
		const [connA, connB] = MockConn.createConnectedPair<ArrayBuffer>()
		const secret = new Uint8Array([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
		]).buffer
		const hostIdA = "hostA"
		const hostIdB = "hostB"
		const timeAddressData = { foo: "bar" }
		const clientA = new PairMaker({
			conn: connA,
			makeData: makePairData({
				role: PairMakeDataRole.SECRET_OFFERER,
				hostId: hostIdA,
				authSecret: secret,
				ownPublicAddress: "addressA",
				timeAddressData,
			}),
			encoder,
		})
		const clientB = new PairMaker({
			conn: connB,
			makeData: makePairData({
				role: PairMakeDataRole.SECRET_CONSUMER,
				hostId: hostIdB,
				authSecret: secret,
				ownPublicAddress: "addressB",
				timeAddressData,
			}),
			encoder,
		})
		let tampered = false
		const origReceive = connB.receive.bind(connB)
		vi.spyOn(connB, "receive").mockImplementation(async () => {
			if (!tampered) {
				tampered = true
				const msg = { protocol: "tws-peer-pair", version: 999 }
				return encoder.encode(msg)
			}
			return origReceive()
		})
		await expect(
			Promise.all([clientA.pair(), clientB.pair()]),
		).rejects.toThrow()
	})

	test("should fail if HMAC is tampered", async () => {
		const [connA, connB] = MockConn.createConnectedPair<ArrayBuffer>()
		const secret = new Uint8Array([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
		]).buffer
		const hostIdA = "hostA"
		const hostIdB = "hostB"
		const timeAddressData = { foo: "bar" }
		const clientA = new PairMaker({
			conn: connA,
			makeData: makePairData({
				role: PairMakeDataRole.SECRET_OFFERER,
				hostId: hostIdA,
				authSecret: secret,
				ownPublicAddress: "addressA",
				timeAddressData,
			}),
			encoder,
		})
		const clientB = new PairMaker({
			conn: connB,
			makeData: makePairData({
				role: PairMakeDataRole.SECRET_CONSUMER,
				hostId: hostIdB,
				authSecret: secret,
				ownPublicAddress: "addressB",
				timeAddressData,
			}),
			encoder,
		})
		let count = 0
		const origReceive = connB.receive.bind(connB)
		vi.spyOn(connB, "receive").mockImplementation(async () => {
			count++
			if (count === 2) {
				const msg = { hmac: "tamperedhmac==" }
				return encoder.encode(msg)
			}
			return origReceive()
		})
		await expect(
			Promise.all([clientA.pair(), clientB.pair()]),
		).rejects.toThrow()
	})

	test("should not leak messages and allow further use of connection after pairing", async () => {
		const [connA, connB] = MockConn.createConnectedPair<ArrayBuffer>()
		const secret = new Uint8Array([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
		]).buffer
		const hostIdA = "hostA"
		const hostIdB = "hostB"
		const timeAddressData = { foo: "bar" }
		const clientA = new PairMaker({
			conn: connA,
			makeData: makePairData({
				role: PairMakeDataRole.SECRET_OFFERER,
				hostId: hostIdA,
				authSecret: secret,
				ownPublicAddress: "addressA",
				timeAddressData,
			}),
			encoder,
		})
		const clientB = new PairMaker({
			conn: connB,
			makeData: makePairData({
				role: PairMakeDataRole.SECRET_CONSUMER,
				hostId: hostIdB,
				authSecret: secret,
				ownPublicAddress: "addressB",
				timeAddressData,
			}),
			encoder,
		})
		await Promise.all([clientA.pair(), clientB.pair()])
		const testMsgA = new Uint8Array([42, 43, 44]).buffer
		const testMsgB = new Uint8Array([99, 98, 97]).buffer
		await connA.send(testMsgA)
		await connB.send(testMsgB)
		const receivedB = await connB.receive()
		const receivedA = await connA.receive()
		expect(arrayBufferEquals(receivedA, testMsgB)).toBe(true)
		expect(arrayBufferEquals(receivedB, testMsgA)).toBe(true)
	})

	test.each([
		[PairMakeDataRole.SECRET_OFFERER],
		[PairMakeDataRole.SECRET_CONSUMER],
	])("should fail if both parties have the same role: %s", async (role) => {
		const [connA, connB] = MockConn.createConnectedPair<ArrayBuffer>()
		const secret = new Uint8Array([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
		]).buffer
		const hostIdA = "hostA"
		const hostIdB = "hostB"
		const timeAddressData = { foo: "bar" }
		const clientA = new PairMaker({
			conn: connA,
			makeData: makePairData({
				role,
				hostId: hostIdA,
				authSecret: secret,
				ownPublicAddress: "addressA",
				timeAddressData,
			}),
			encoder,
		})
		const clientB = new PairMaker({
			conn: connB,
			makeData: makePairData({
				role,
				hostId: hostIdB,
				authSecret: secret,
				ownPublicAddress: "addressB",
				timeAddressData,
			}),
			encoder,
		})
		await expect(
			Promise.all([clientA.pair(), clientB.pair()]),
		).rejects.toThrow()
	})
})
