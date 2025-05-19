import { describe, expect, test } from "vitest"
import { SdelkaCardData } from "../../sdelkaCardData"
import { StoredSdelkaCardData } from "./schema"
import { StoredSdelkaCardDataSerializer } from "./serializer"

const exampleData: SdelkaCardData = {
	globalId: "abc123",
	content: "example content",
	createdAtTimestamp: 1234567890,
	lastUpdatedAtTimestamp: 1234567899,
}

describe("StoredSdelkaCardDataSerializer", () => {
	test("serialize returns correct structure with version 1", () => {
		const serialized = StoredSdelkaCardDataSerializer.serialize(exampleData)
		expect(serialized.version).toBe(1)
		expect(serialized.data).toEqual(exampleData)
		expect(serialized).toMatchSnapshot()
	})

	test("deserialize returns correct SdelkaCardData for version 1", () => {
		const storedData: StoredSdelkaCardData = {
			version: 1,
			data: exampleData,
		}
		const deserialized =
			StoredSdelkaCardDataSerializer.deserialize(storedData)
		expect(deserialized).toEqual(exampleData)
		expect(deserialized).toMatchSnapshot()
	})

	test("serialize then deserialize returns original value", () => {
		const serialized = StoredSdelkaCardDataSerializer.serialize(exampleData)
		const deserialized =
			StoredSdelkaCardDataSerializer.deserialize(serialized)
		expect(deserialized).toEqual(exampleData)
	})

	test("deserialize then serialize returns original value", () => {
		const storedData: StoredSdelkaCardData = {
			version: 1,
			data: exampleData,
		}
		const deserialized =
			StoredSdelkaCardDataSerializer.deserialize(storedData)
		const serialized =
			StoredSdelkaCardDataSerializer.serialize(deserialized)
		expect(serialized).toEqual(storedData)
	})
})
