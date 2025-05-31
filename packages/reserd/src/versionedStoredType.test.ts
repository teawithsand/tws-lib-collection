import { describe, expect, test } from "vitest"
import { z } from "zod"
import { SerializerTester, TestData } from "./tester"
import {
	VersionedStoredType,
	createVersionedSchema,
} from "./versionedStoredType"

// Test types
interface User {
	readonly id: string
	readonly name: string
	readonly email: string
	readonly age: number
	readonly preferences: {
		readonly theme: "light" | "dark"
		readonly notifications: boolean
	}
}

type UserStoredV1 = {
	readonly version: 1
	readonly data: {
		readonly id: string
		readonly name: string
		readonly email: string
	}
}

type UserStoredV3 = {
	readonly version: 3
	readonly data: {
		readonly id: string
		readonly name: string
		readonly email: string
		readonly age: number
		readonly preferences: {
			readonly theme: "light" | "dark"
			readonly notifications: boolean
		}
	}
}

type UserStored = UserStoredV1 | UserStoredV3

// Schemas
const userV1DataSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string(),
})

const userV3DataSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string(),
	age: z.number(),
	preferences: z.object({
		theme: z.enum(["light", "dark"]),
		notifications: z.boolean(),
	}),
})

// Deserializers
const deserializeV1 = (stored: UserStoredV1): User => ({
	id: stored.data.id,
	name: stored.data.name,
	email: stored.data.email,
	age: 25,
	preferences: { theme: "light", notifications: true },
})

const deserializeV3 = (stored: UserStoredV3): User => ({
	id: stored.data.id,
	name: stored.data.name,
	email: stored.data.email,
	age: stored.data.age,
	preferences: stored.data.preferences,
})

const serializeUser = (user: User): UserStoredV3 => ({
	version: 3,
	data: {
		id: user.id,
		name: user.name,
		email: user.email,
		age: user.age,
		preferences: user.preferences,
	},
})

describe("VersionedStoredType", () => {
	const userVersionedType = VersionedStoredType.create<UserStored, User>({
		config: {
			versions: {
				1: {
					schema: createVersionedSchema(1, userV1DataSchema),
					deserializer: deserializeV1,
				},
				3: {
					schema: createVersionedSchema(3, userV3DataSchema),
					deserializer: deserializeV3,
				},
			},
			currentSerializer: serializeUser,
		},
	})

	test("should serialize and deserialize with version migration", () => {
		const user: User = {
			id: "123",
			name: "John Doe",
			email: "john@example.com",
			age: 30,
			preferences: { theme: "dark", notifications: false },
		}

		// Serialize to current version (v3)
		const serialized = userVersionedType.serialize(user)
		expect(serialized.version).toBe(3)
		expect(serialized.data).toEqual({
			id: "123",
			name: "John Doe",
			email: "john@example.com",
			age: 30,
			preferences: { theme: "dark", notifications: false },
		})

		// Deserialize from v1 (with defaults)
		const storedV1: UserStoredV1 = {
			version: 1,
			data: { id: "123", name: "John Doe", email: "john@example.com" },
		}
		const fromV1 = userVersionedType.deserialize(storedV1)
		expect(fromV1).toEqual({
			id: "123",
			name: "John Doe",
			email: "john@example.com",
			age: 25,
			preferences: { theme: "light", notifications: true },
		})

		// Round trip should work
		const roundTrip = userVersionedType.deserialize(serialized)
		expect(roundTrip).toEqual(user)
	})

	test("should handle schema operations and current version", () => {
		expect(userVersionedType.getCurrentVersion()).toBe(3)

		const schema = userVersionedType.getSchema()
		expect(schema).toBeDefined()

		const v1Schema = userVersionedType.getVersionSchema(1)
		const v3Schema = userVersionedType.getVersionSchema(3)
		expect(v1Schema).toBeDefined()
		expect(v3Schema).toBeDefined()
	})

	test("should parse and handle invalid data", () => {
		const validData = {
			version: 1,
			data: { id: "456", name: "Jane", email: "jane@example.com" },
		}
		const result = userVersionedType.parseAndDeserialize(validData)
		expect(result.id).toBe("456")

		const invalidData = {
			version: 1,
			data: { id: 123, name: "Jane", email: "jane@example.com" },
		}
		expect(() =>
			userVersionedType.parseAndDeserialize(invalidData),
		).toThrow()
	})

	describe("createSimple and configurations", () => {
		test("should work with simplified configuration", () => {
			const userVersionedTypeSimple = VersionedStoredType.createSimple<
				UserStored,
				User
			>({
				config: {
					versions: {
						1: {
							dataSchema: userV1DataSchema,
							deserializer: deserializeV1,
						},
						3: {
							dataSchema: userV3DataSchema,
							deserializer: deserializeV3,
						},
					},
					currentSerializer: serializeUser,
				},
			})

			const user: User = {
				id: "789",
				name: "Bob Smith",
				email: "bob@example.com",
				age: 40,
				preferences: {
					theme: "light",
					notifications: true,
				},
			}

			const serialized = userVersionedTypeSimple.serialize(user)
			const deserialized = userVersionedTypeSimple.deserialize(serialized)

			expect(deserialized).toEqual(user)
		})

		test("should use explicit current version when provided", () => {
			const userVersionedTypeV1 = VersionedStoredType.create<
				UserStored,
				User
			>({
				config: {
					versions: {
						1: {
							schema: createVersionedSchema(1, userV1DataSchema),
							deserializer: deserializeV1,
						},
						3: {
							schema: createVersionedSchema(3, userV3DataSchema),
							deserializer: deserializeV3,
						},
					},
					currentSerializer: (user: User): UserStoredV1 => ({
						version: 1,
						data: {
							id: user.id,
							name: user.name,
							email: user.email,
						},
					}),
					currentVersion: 1,
				},
			})

			expect(userVersionedTypeV1.getCurrentVersion()).toBe(1)
		})
	})

	describe("single version and error handling", () => {
		test("should work with single version configuration", () => {
			const singleVersionType = VersionedStoredType.createSimple<
				UserStoredV1,
				User
			>({
				config: {
					versions: {
						1: {
							dataSchema: userV1DataSchema,
							deserializer: deserializeV1,
						},
					},
					currentSerializer: (user: User): UserStoredV1 => ({
						version: 1,
						data: {
							id: user.id,
							name: user.name,
							email: user.email,
						},
					}),
				},
			})

			const user: User = {
				id: "single",
				name: "Single User",
				email: "single@example.com",
				age: 25,
				preferences: {
					theme: "light",
					notifications: true,
				},
			}

			const serialized = singleVersionType.serialize(user)
			const deserialized = singleVersionType.deserialize(serialized)

			expect(serialized.version).toBe(1)
			expect(deserialized.id).toBe("single")
			expect(singleVersionType.getCurrentVersion()).toBe(1)

			const schema = singleVersionType.getSchema()
			expect(schema).toBeDefined()
		})

		test("should throw error when no versions are configured", () => {
			expect(() => {
				VersionedStoredType.create<UserStored, User>({
					config: {
						versions: {} as any,
						currentSerializer: serializeUser,
					},
				})
			}).toThrow("At least one version must be configured")

			expect(() => {
				VersionedStoredType.createSimple<UserStored, User>({
					config: {
						versions: {} as any,
						currentSerializer: serializeUser,
					},
				})
			}).toThrow("At least one version must be configured")
		})
	})

	describe("SerializerTester integration", () => {
		test("should pass comprehensive serializer testing", () => {
			const userVersionedType = VersionedStoredType.createSimple<
				UserStored,
				User
			>({
				config: {
					versions: {
						1: {
							dataSchema: userV1DataSchema,
							deserializer: deserializeV1,
						},
						3: {
							dataSchema: userV3DataSchema,
							deserializer: deserializeV3,
						},
					},
					currentSerializer: serializeUser,
				},
			})

			const testData = new TestData<UserStored, User>({
				storedExamples: [
					{
						version: 1,
						data: {
							id: "test1",
							name: "Test User 1",
							email: "test1@example.com",
						},
					},
					{
						version: 3,
						data: {
							id: "test3",
							name: "Test User 3",
							email: "test3@example.com",
							age: 25,
							preferences: {
								theme: "dark",
								notifications: false,
							},
						},
					},
				],
				ownedExamples: [
					{
						id: "owned1",
						name: "Owned User 1",
						email: "owned1@example.com",
						age: 28,
						preferences: {
							theme: "light",
							notifications: true,
						},
					},
					{
						id: "owned2",
						name: "Owned User 2",
						email: "owned2@example.com",
						age: 35,
						preferences: {
							theme: "dark",
							notifications: false,
						},
					},
				],
				pairExamples: [
					[
						{
							version: 3,
							data: {
								id: "pair1",
								name: "Pair User 1",
								email: "pair1@example.com",
								age: 40,
								preferences: {
									theme: "light",
									notifications: true,
								},
							},
						},
						{
							id: "pair1",
							name: "Pair User 1",
							email: "pair1@example.com",
							age: 40,
							preferences: {
								theme: "light",
								notifications: true,
							},
						},
					],
				],
			})

			const serializer = userVersionedType.getSerializer()
			const tester = new SerializerTester({ testData, serializer })

			expect(() => tester.runAllTests()).not.toThrow()

			// Test individual methods
			expect(() => tester.testSerialize()).not.toThrow()
			expect(() => tester.testDeserialize()).not.toThrow()
			expect(() => tester.testRoundTrip()).not.toThrow()
		})

		test("should work with TestData factory methods", () => {
			const userVersionedType = VersionedStoredType.createSimple<
				UserStored,
				User
			>({
				config: {
					versions: {
						1: {
							dataSchema: userV1DataSchema,
							deserializer: deserializeV1,
						},
						3: {
							dataSchema: userV3DataSchema,
							deserializer: deserializeV3,
						},
					},
					currentSerializer: serializeUser,
				},
			})

			const testDataFromPairs = TestData.createFromPairs<
				UserStored,
				User
			>([
				[
					{
						version: 3,
						data: {
							id: "factory1",
							name: "Factory Test 1",
							email: "factory1@example.com",
							age: 32,
							preferences: {
								theme: "light",
								notifications: true,
							},
						},
					},
					{
						id: "factory1",
						name: "Factory Test 1",
						email: "factory1@example.com",
						age: 32,
						preferences: {
							theme: "light",
							notifications: true,
						},
					},
				],
			])

			const testDataComplete = TestData.createComplete<UserStored, User>({
				storedExamples: [
					{
						version: 1,
						data: {
							id: "complete1",
							name: "Complete Test 1",
							email: "complete1@example.com",
						},
					},
				],
				ownedExamples: [
					{
						id: "complete2",
						name: "Complete Test 2",
						email: "complete2@example.com",
						age: 28,
						preferences: {
							theme: "light",
							notifications: true,
						},
					},
				],
				pairExamples: [],
			})

			const serializer = userVersionedType.getSerializer()

			const testerFromPairs = new SerializerTester({
				testData: testDataFromPairs,
				serializer,
			})
			const testerComplete = new SerializerTester({
				testData: testDataComplete,
				serializer,
			})

			expect(() => testerFromPairs.runAllTests()).not.toThrow()
			expect(() => testerComplete.runAllTests()).not.toThrow()
		})
	})
})
