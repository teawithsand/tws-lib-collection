import { describe, expect, test } from "vitest"
import { MintayCardData } from "../../cardData"
import { StoredMintayCardData } from "./schema"
import { StoredMintayCardDataSerializer } from "./serializer"

const exampleData: MintayCardData = {
	globalId: "abc123",
	content: "example content",
	createdAtTimestamp: 1234567890,
	lastUpdatedAtTimestamp: 1234567899,
}

describe("StoredMintayCardDataSerializer", () => {
	test("serialize returns correct structure with version 1", () => {
		const serialized = StoredMintayCardDataSerializer.serialize(exampleData)
		expect(serialized.version).toBe(1)
		expect(serialized.data).toEqual(exampleData)
		expect(serialized).toMatchSnapshot()
	})

	test("deserialize returns correct MintayCardData for version 1", () => {
		const storedData: StoredMintayCardData = {
			version: 1,
			data: exampleData,
		}
		const deserialized =
			StoredMintayCardDataSerializer.deserialize(storedData)
		expect(deserialized).toEqual(exampleData)
		expect(deserialized).toMatchSnapshot()
	})

	test("serialize then deserialize returns original value", () => {
		const serialized = StoredMintayCardDataSerializer.serialize(exampleData)
		const deserialized =
			StoredMintayCardDataSerializer.deserialize(serialized)
		expect(deserialized).toEqual(exampleData)
	})

	test("deserialize then serialize returns original value", () => {
		const storedData: StoredMintayCardData = {
			version: 1,
			data: exampleData,
		}
		const deserialized =
			StoredMintayCardDataSerializer.deserialize(storedData)
		const serialized =
			StoredMintayCardDataSerializer.serialize(deserialized)
		expect(serialized).toEqual(storedData)
	})
})
