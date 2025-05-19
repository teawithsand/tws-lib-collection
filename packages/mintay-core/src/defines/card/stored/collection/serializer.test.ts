import { describe, expect, test } from "vitest"
import { SdelkaCollectionData } from "../../sdelkaCollectionData"
import { StoredSdelkaCollectionData } from "./schema"
import { StoredSdelkaCollectionDataSerializer } from "./serializer"

const exampleData: SdelkaCollectionData = {
	globalId: "col123",
	title: "Example Collection",
	description: "A description of the example collection",
	createdAtTimestamp: 1234567890,
	lastUpdatedAtTimestamp: 1234567899,
}

describe("StoredSdelkaCollectionDataSerializer", () => {
	test("serialize returns correct structure with version 1", () => {
		const serialized =
			StoredSdelkaCollectionDataSerializer.serialize(exampleData)
		expect(serialized.version).toBe(1)
		expect(serialized.data).toEqual(exampleData)
		expect(serialized).toMatchSnapshot()
	})

	test("deserialize returns correct SdelkaCollectionData for version 1", () => {
		const storedData: StoredSdelkaCollectionData = {
			version: 1,
			data: exampleData,
		}
		const deserialized =
			StoredSdelkaCollectionDataSerializer.deserialize(storedData)
		expect(deserialized).toEqual(exampleData)
		expect(deserialized).toMatchSnapshot()
	})

	test("serialize then deserialize returns original value", () => {
		const serialized =
			StoredSdelkaCollectionDataSerializer.serialize(exampleData)
		const deserialized =
			StoredSdelkaCollectionDataSerializer.deserialize(serialized)
		expect(deserialized).toEqual(exampleData)
	})

	test("deserialize then serialize returns original value", () => {
		const storedData: StoredSdelkaCollectionData = {
			version: 1,
			data: exampleData,
		}
		const deserialized =
			StoredSdelkaCollectionDataSerializer.deserialize(storedData)
		const serialized =
			StoredSdelkaCollectionDataSerializer.serialize(deserialized)
		expect(serialized).toEqual(storedData)
	})
})
