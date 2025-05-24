import { describe, expect, test } from "vitest"
import { MintayCollectionData } from "../../collectionData"
import { StoredMintayCollectionData } from "./schema"
import { StoredMintayCollectionDataSerializer } from "./serializer"

const exampleData: MintayCollectionData = {
	globalId: "col123",
	title: "Example Collection",
	description: "A description of the example collection",
	createdAtTimestamp: 1234567890,
	lastUpdatedAtTimestamp: 1234567899,
}

describe("StoredMintayCollectionDataSerializer", () => {
	test("serialize returns correct structure with version 1", () => {
		const serialized =
			StoredMintayCollectionDataSerializer.serialize(exampleData)
		expect(serialized.version).toBe(1)
		expect(serialized.data).toEqual(exampleData)
		expect(serialized).toMatchSnapshot()
	})

	test("deserialize returns correct MintayCollectionData for version 1", () => {
		const storedData: StoredMintayCollectionData = {
			version: 1,
			data: exampleData,
		}
		const deserialized =
			StoredMintayCollectionDataSerializer.deserialize(storedData)
		expect(deserialized).toEqual(exampleData)
		expect(deserialized).toMatchSnapshot()
	})

	test("serialize then deserialize returns original value", () => {
		const serialized =
			StoredMintayCollectionDataSerializer.serialize(exampleData)
		const deserialized =
			StoredMintayCollectionDataSerializer.deserialize(serialized)
		expect(deserialized).toEqual(exampleData)
	})

	test("deserialize then serialize returns original value", () => {
		const storedData: StoredMintayCollectionData = {
			version: 1,
			data: exampleData,
		}
		const deserialized =
			StoredMintayCollectionDataSerializer.deserialize(storedData)
		const serialized =
			StoredMintayCollectionDataSerializer.serialize(deserialized)
		expect(serialized).toEqual(storedData)
	})
})
