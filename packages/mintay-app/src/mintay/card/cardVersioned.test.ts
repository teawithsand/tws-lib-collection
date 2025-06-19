import { SerializerTester, TestData } from "@teawithsand/reserd"
import { describe, test } from "vitest"
import { AppCardData } from "./card"
import { AppCardDataVersionedType } from "./cardVersioned"

type CardDataStored = {
	version: 1
	data: {
		globalId: string
		discoveryPriority: number
		questionContent: string
		answerContent: string
		createdAt: number
		updatedAt: number
	}
}

describe("CardDataVersionedType", () => {
	const createTestData = (): TestData<CardDataStored, AppCardData> => {
		const ownedExamples: AppCardData[] = [
			{
				globalId: "card-1",
				questionContent: "What is the capital of France?",
				answerContent: "Paris",
				discoveryPriority: 100,
				createdAt: 1000000000000,
				updatedAt: 1000000000000,
			},
			{
				globalId: "card-2",
				questionContent: "Define photosynthesis",
				answerContent:
					"The process by which plants convert light energy into chemical energy",
				discoveryPriority: 250,
				createdAt: 1000000001000,
				updatedAt: 1000000001000,
			},
			{
				globalId: "card-3",
				questionContent: "How do you say 'hello' in Spanish?",
				answerContent: "Hola",
				discoveryPriority: 50,
				createdAt: 1000000002000,
				updatedAt: 1000000002000,
			},
			{
				globalId: "card-4",
				questionContent: "Explain the theory of relativity",
				answerContent:
					"Einstein's theory describing the relationship between space and time",
				discoveryPriority: 500,
				createdAt: 1000000003000,
				updatedAt: 1000000003000,
			},
			{
				globalId: "card-5",
				questionContent: "",
				answerContent: "",
				discoveryPriority: 0,
				createdAt: 1000000004000,
				updatedAt: 1000000004000,
			},
		]

		const storedExamples = [
			{
				version: 1 as const,
				data: {
					globalId: "card-1",
					questionContent: "What is the capital of France?",
					answerContent: "Paris",
					discoveryPriority: 100,
					createdAt: 1000000000000,
					updatedAt: 1000000000000,
				},
			},
			{
				version: 1 as const,
				data: {
					globalId: "card-2",
					questionContent: "Define photosynthesis",
					answerContent:
						"The process by which plants convert light energy into chemical energy",
					discoveryPriority: 250,
					createdAt: 1000000001000,
					updatedAt: 1000000001000,
				},
			},
			{
				version: 1 as const,
				data: {
					globalId: "card-3",
					questionContent: "How do you say 'hello' in Spanish?",
					answerContent: "Hola",
					discoveryPriority: 50,
					createdAt: 1000000002000,
					updatedAt: 1000000002000,
				},
			},
			{
				version: 1 as const,
				data: {
					globalId: "card-4",
					questionContent: "Explain the theory of relativity",
					answerContent:
						"Einstein's theory describing the relationship between space and time",
					discoveryPriority: 500,
					createdAt: 1000000003000,
					updatedAt: 1000000003000,
				},
			},
			{
				version: 1 as const,
				data: {
					globalId: "card-5",
					questionContent: "",
					answerContent: "",
					discoveryPriority: 0,
					createdAt: 1000000004000,
					updatedAt: 1000000004000,
				},
			},
		]

		const pairExamples: [CardDataStored, AppCardData][] = [
			[
				{
					version: 1 as const,
					data: {
						globalId: "card-1",
						questionContent: "What is the capital of France?",
						answerContent: "Paris",
						discoveryPriority: 100,
						createdAt: 1000000000000,
						updatedAt: 1000000000000,
					},
				},
				{
					globalId: "card-1",
					questionContent: "What is the capital of France?",
					answerContent: "Paris",
					discoveryPriority: 100,
					createdAt: 1000000000000,
					updatedAt: 1000000000000,
				},
			],
			[
				{
					version: 1 as const,
					data: {
						globalId: "card-2",
						questionContent: "Define photosynthesis",
						answerContent:
							"The process by which plants convert light energy into chemical energy",
						discoveryPriority: 250,
						createdAt: 1000000001000,
						updatedAt: 1000000001000,
					},
				},
				{
					globalId: "card-2",
					questionContent: "Define photosynthesis",
					answerContent:
						"The process by which plants convert light energy into chemical energy",
					discoveryPriority: 250,
					createdAt: 1000000001000,
					updatedAt: 1000000001000,
				},
			],
			[
				{
					version: 1 as const,
					data: {
						globalId: "card-3",
						questionContent: "How do you say 'hello' in Spanish?",
						answerContent: "Hola",
						discoveryPriority: 50,
						createdAt: 1000000002000,
						updatedAt: 1000000002000,
					},
				},
				{
					globalId: "card-3",
					questionContent: "How do you say 'hello' in Spanish?",
					answerContent: "Hola",
					discoveryPriority: 50,
					createdAt: 1000000002000,
					updatedAt: 1000000002000,
				},
			],
			[
				{
					version: 1 as const,
					data: {
						globalId: "card-4",
						questionContent: "Explain the theory of relativity",
						answerContent:
							"Einstein's theory describing the relationship between space and time",
						discoveryPriority: 500,
						createdAt: 1000000003000,
						updatedAt: 1000000003000,
					},
				},
				{
					globalId: "card-4",
					questionContent: "Explain the theory of relativity",
					answerContent:
						"Einstein's theory describing the relationship between space and time",
					discoveryPriority: 500,
					createdAt: 1000000003000,
					updatedAt: 1000000003000,
				},
			],
			[
				{
					version: 1 as const,
					data: {
						globalId: "card-5",
						questionContent: "",
						answerContent: "",
						discoveryPriority: 0,
						createdAt: 1000000004000,
						updatedAt: 1000000004000,
					},
				},
				{
					globalId: "card-5",
					questionContent: "",
					answerContent: "",
					discoveryPriority: 0,
					createdAt: 1000000004000,
					updatedAt: 1000000004000,
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
			serializer: AppCardDataVersionedType,
		})
		tester.runAllTests()
	})
})
