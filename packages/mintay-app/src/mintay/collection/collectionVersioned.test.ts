import { SerializerTester, TestData } from "@teawithsand/reserd"
import { describe, test } from "vitest"
import { AppCollectionData } from "./collection"
import { AppCollectionDataVersionedType } from "./collectionVersioned"

type CollectionDataStored = {
	version: 1
	data: {
		globalId: string
		content: string
		description: string
		createdAt: number
		updatedAt: number
	}
}

describe("CollectionDataVersionedType", () => {
	const createTestData = (): TestData<
		CollectionDataStored,
		AppCollectionData
	> => {
		const ownedExamples: AppCollectionData[] = [
			{
				globalId: "coll-1",
				title: "French Vocabulary Collection",
				description: "A collection of French vocabulary words",
				createdAt: 1640995200000,
				updatedAt: 1640995200000,
			},
			{
				globalId: "coll-2",
				title: "Math Formulas Collection",
				description: "Essential mathematical formulas",
				createdAt: 1641081600000,
				updatedAt: 1641081600000,
			},
			{
				globalId: "coll-3",
				title: "History Facts Collection",
				description: "Important historical facts",
				createdAt: 1641168000000,
				updatedAt: 1641168000000,
			},
			{
				globalId: "coll-4",
				title: "Science Concepts Collection",
				description: "Basic science concepts",
				createdAt: 1641254400000,
				updatedAt: 1641254400000,
			},
			{
				globalId: "",
				title: "",
				description: "",
				createdAt: 0,
				updatedAt: 0,
			},
		]

		const storedExamples: CollectionDataStored[] = [
			{
				version: 1 as const,
				data: {
					globalId: "coll-1",
					content: "French Vocabulary Collection",
					description: "A collection of French vocabulary words",
					createdAt: 1640995200000,
					updatedAt: 1640995200000,
				},
			},
			{
				version: 1 as const,
				data: {
					globalId: "coll-2",
					content: "Math Formulas Collection",
					description: "Essential mathematical formulas",
					createdAt: 1641081600000,
					updatedAt: 1641081600000,
				},
			},
			{
				version: 1 as const,
				data: {
					globalId: "coll-3",
					content: "History Facts Collection",
					description: "Important historical facts",
					createdAt: 1641168000000,
					updatedAt: 1641168000000,
				},
			},
			{
				version: 1 as const,
				data: {
					globalId: "coll-4",
					content: "Science Concepts Collection",
					description: "Basic science concepts",
					createdAt: 1641254400000,
					updatedAt: 1641254400000,
				},
			},
			{
				version: 1 as const,
				data: {
					globalId: "",
					content: "",
					description: "",
					createdAt: 0,
					updatedAt: 0,
				},
			},
		]

		const pairExamples: [CollectionDataStored, AppCollectionData][] = [
			[
				{
					version: 1 as const,
					data: {
						globalId: "coll-1",
						content: "French Vocabulary Collection",
						description: "A collection of French vocabulary words",
						createdAt: 1640995200000,
						updatedAt: 1640995200000,
					},
				},
				{
					globalId: "coll-1",
					title: "French Vocabulary Collection",
					description: "A collection of French vocabulary words",
					createdAt: 1640995200000,
					updatedAt: 1640995200000,
				},
			],
			[
				{
					version: 1 as const,
					data: {
						globalId: "coll-2",
						content: "Math Formulas Collection",
						description: "Essential mathematical formulas",
						createdAt: 1641081600000,
						updatedAt: 1641081600000,
					},
				},
				{
					globalId: "coll-2",
					title: "Math Formulas Collection",
					description: "Essential mathematical formulas",
					createdAt: 1641081600000,
					updatedAt: 1641081600000,
				},
			],
			[
				{
					version: 1 as const,
					data: {
						globalId: "coll-3",
						content: "History Facts Collection",
						description: "Important historical facts",
						createdAt: 1641168000000,
						updatedAt: 1641168000000,
					},
				},
				{
					globalId: "coll-3",
					title: "History Facts Collection",
					description: "Important historical facts",
					createdAt: 1641168000000,
					updatedAt: 1641168000000,
				},
			],
			[
				{
					version: 1 as const,
					data: {
						globalId: "coll-4",
						content: "Science Concepts Collection",
						description: "Basic science concepts",
						createdAt: 1641254400000,
						updatedAt: 1641254400000,
					},
				},
				{
					globalId: "coll-4",
					title: "Science Concepts Collection",
					description: "Basic science concepts",
					createdAt: 1641254400000,
					updatedAt: 1641254400000,
				},
			],
			[
				{
					version: 1 as const,
					data: {
						globalId: "",
						content: "",
						description: "",
						createdAt: 0,
						updatedAt: 0,
					},
				},
				{
					globalId: "",
					title: "",
					description: "",
					createdAt: 0,
					updatedAt: 0,
				},
			],
		]

		return new TestData({
			storedExamples,
			ownedExamples,
			pairExamples,
		})
	}

	test("runAllTests", () => {
		const testData = createTestData()
		const tester = new SerializerTester({
			testData,
			serializer: AppCollectionDataVersionedType,
		})
		tester.runAllTests()
	})
})
