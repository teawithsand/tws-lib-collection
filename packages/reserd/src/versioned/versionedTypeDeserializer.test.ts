import { describe, expect, test } from "vitest"
import { z } from "zod"
import type { VersionedTypeDataMap } from "./types"
import {
	VersionedTypeDeserializer,
	type VersionedTypeDeserializerConfig,
} from "./versionedTypeDeserializer"

// Test data structures for different versions
type UserV1 = {
	name: string
}

type UserV2 = {
	firstName: string
	lastName: string
}

type UserV3 = {
	firstName: string
	lastName: string
	email: string
}

// Target type that all versions deserialize to
type User = {
	firstName: string
	lastName: string
	email?: string
}

// Versioned data map
type UserVersionedData = {
	1: UserV1
	2: UserV2
	3: UserV3
}

describe("VersionedTypeDeserializer", () => {
	const userConfig: VersionedTypeDeserializerConfig<UserVersionedData, User> =
		{
			1: {
				schema: z.object({
					name: z.string(),
				}),
				deserializer: (data: UserV1): User => ({
					firstName: data.name.split(" ")[0] || data.name,
					lastName: data.name.split(" ")[1] || "",
				}),
			},
			2: {
				schema: z.object({
					firstName: z.string(),
					lastName: z.string(),
				}),
				deserializer: (data: UserV2): User => ({
					firstName: data.firstName,
					lastName: data.lastName,
				}),
			},
			3: {
				schema: z.object({
					firstName: z.string(),
					lastName: z.string(),
					email: z.string(),
				}),
				deserializer: (data: UserV3): User => ({
					firstName: data.firstName,
					lastName: data.lastName,
					email: data.email,
				}),
			},
		}

	describe("constructor", () => {
		test("should create instance with valid config", () => {
			// Arrange & Act
			const deserializer = new VersionedTypeDeserializer(userConfig)

			// Assert
			expect(deserializer).toBeInstanceOf(VersionedTypeDeserializer)
		})
	})

	describe("getSchema", () => {
		test("should return properly typed schema", () => {
			// Arrange
			const deserializer = new VersionedTypeDeserializer(userConfig)

			// Act
			const schema = deserializer.getSchema()

			// Assert
			expect(schema).toBeDefined()
			expect(typeof schema.parse).toBe("function")
		})

		test("should validate version 1 data structure", () => {
			// Arrange
			const deserializer = new VersionedTypeDeserializer(userConfig)
			const schema = deserializer.getSchema()
			const validV1Data = {
				version: 1,
				data: { name: "John Doe" },
			}

			// Act & Assert
			expect(() => schema.parse(validV1Data)).not.toThrow()
		})

		test("should validate version 2 data structure", () => {
			// Arrange
			const deserializer = new VersionedTypeDeserializer(userConfig)
			const schema = deserializer.getSchema()
			const validV2Data = {
				version: 2,
				data: { firstName: "John", lastName: "Doe" },
			}

			// Act & Assert
			expect(() => schema.parse(validV2Data)).not.toThrow()
		})

		test("should validate version 3 data structure", () => {
			// Arrange
			const deserializer = new VersionedTypeDeserializer(userConfig)
			const schema = deserializer.getSchema()
			const validV3Data = {
				version: 3,
				data: {
					firstName: "John",
					lastName: "Doe",
					email: "john@example.com",
				},
			}

			// Act & Assert
			expect(() => schema.parse(validV3Data)).not.toThrow()
		})

		test("should reject invalid version", () => {
			// Arrange
			const deserializer = new VersionedTypeDeserializer(userConfig)
			const schema = deserializer.getSchema()
			const invalidData = {
				version: 99,
				data: { name: "John Doe" },
			}

			// Act & Assert
			expect(() => schema.parse(invalidData)).toThrow()
		})

		test("should reject missing version field", () => {
			// Arrange
			const deserializer = new VersionedTypeDeserializer(userConfig)
			const schema = deserializer.getSchema()
			const invalidData = {
				data: { name: "John Doe" },
			}

			// Act & Assert
			expect(() => schema.parse(invalidData)).toThrow()
		})

		test("should reject missing data field", () => {
			// Arrange
			const deserializer = new VersionedTypeDeserializer(userConfig)
			const schema = deserializer.getSchema()
			const invalidData = {
				version: 1,
			}

			// Act & Assert
			expect(() => schema.parse(invalidData)).toThrow()
		})

		test("should reject data that doesn't match version schema", () => {
			// Arrange
			const deserializer = new VersionedTypeDeserializer(userConfig)
			const schema = deserializer.getSchema()
			const invalidData = {
				version: 1,
				data: { firstName: "John", lastName: "Doe" }, // Wrong structure for v1
			}

			// Act & Assert
			expect(() => schema.parse(invalidData)).toThrow()
		})
	})

	describe("deserialize", () => {
		test("should deserialize version 1 data correctly", () => {
			// Arrange
			const deserializer = new VersionedTypeDeserializer(userConfig)
			const v1Data = {
				version: 1,
				data: { name: "John Doe" },
			}

			// Act
			const result = deserializer.deserialize(v1Data)

			// Assert
			expect(result).toEqual({
				firstName: "John",
				lastName: "Doe",
			})
		})

		test("should deserialize version 1 data with single name", () => {
			// Arrange
			const deserializer = new VersionedTypeDeserializer(userConfig)
			const v1Data = {
				version: 1,
				data: { name: "John" },
			}

			// Act
			const result = deserializer.deserialize(v1Data as unknown as any)

			// Assert
			expect(result).toEqual({
				firstName: "John",
				lastName: "",
			})
		})

		test("should deserialize version 2 data correctly", () => {
			// Arrange
			const deserializer = new VersionedTypeDeserializer(userConfig)
			const v2Data = {
				version: 2,
				data: { firstName: "Jane", lastName: "Smith" },
			}

			// Act
			const result = deserializer.deserialize(v2Data)

			// Assert
			expect(result).toEqual({
				firstName: "Jane",
				lastName: "Smith",
			})
		})

		test("should deserialize version 3 data correctly", () => {
			// Arrange
			const deserializer = new VersionedTypeDeserializer(userConfig)
			const v3Data = {
				version: 3,
				data: {
					firstName: "Alice",
					lastName: "Johnson",
					email: "alice@example.com",
				},
			}

			// Act
			const result = deserializer.deserialize(v3Data)

			// Assert
			expect(result).toEqual({
				firstName: "Alice",
				lastName: "Johnson",
				email: "alice@example.com",
			})
		})

		test("should throw error for invalid input format", () => {
			// Arrange
			const deserializer = new VersionedTypeDeserializer(userConfig)
			const invalidData = "not an object"

			// Act & Assert
			expect(() => deserializer.deserialize(invalidData)).toThrow()
		})

		test("should throw error for unsupported version in valid format", () => {
			// Arrange
			const deserializer = new VersionedTypeDeserializer(userConfig)
			const invalidData = {
				version: 99,
				data: { name: "John Doe" },
			}

			// Act & Assert
			expect(() => deserializer.deserialize(invalidData)).toThrow()
		})

		test("should throw error for missing version field", () => {
			// Arrange
			const deserializer = new VersionedTypeDeserializer(userConfig)
			const invalidData = {
				data: { name: "John Doe" },
			}

			// Act & Assert
			expect(() => deserializer.deserialize(invalidData)).toThrow()
		})

		test("should throw error for missing data field", () => {
			// Arrange
			const deserializer = new VersionedTypeDeserializer(userConfig)
			const invalidData = {
				version: 1,
			}

			// Act & Assert
			expect(() => deserializer.deserialize(invalidData)).toThrow()
		})

		test("should throw error when data doesn't match version schema", () => {
			// Arrange
			const deserializer = new VersionedTypeDeserializer(userConfig)
			const invalidData = {
				version: 1,
				data: { firstName: "John", lastName: "Doe" }, // Wrong structure for v1
			}

			// Act & Assert
			expect(() => deserializer.deserialize(invalidData)).toThrow()
		})
	})

	describe("edge cases", () => {
		test("should handle empty string values in data", () => {
			// Arrange
			const deserializer = new VersionedTypeDeserializer(userConfig)
			const dataWithEmptyStrings = {
				version: 2,
				data: { firstName: "", lastName: "" },
			}

			// Act
			const result = deserializer.deserialize(dataWithEmptyStrings)

			// Assert
			expect(result).toEqual({
				firstName: "",
				lastName: "",
			})
		})

		test("should handle special characters in data", () => {
			// Arrange
			const deserializer = new VersionedTypeDeserializer(userConfig)
			const dataWithSpecialChars = {
				version: 3,
				data: {
					firstName: "José",
					lastName: "García-López",
					email: "jose@test.co.uk",
				},
			}

			// Act
			const result = deserializer.deserialize(dataWithSpecialChars)

			// Assert
			expect(result).toEqual({
				firstName: "José",
				lastName: "García-López",
				email: "jose@test.co.uk",
			})
		})
	})

	describe("type safety", () => {
		test("should work with different data types", () => {
			// Arrange
			type NumberVersionedData = {
				1: { value: number }
				2: { count: number; multiplier: number }
			}

			const numberConfig: VersionedTypeDeserializerConfig<
				NumberVersionedData,
				number
			> = {
				1: {
					schema: z.object({ value: z.number() }),
					deserializer: (data) => data.value,
				},
				2: {
					schema: z.object({
						count: z.number(),
						multiplier: z.number(),
					}),
					deserializer: (data) => data.count * data.multiplier,
				},
			}

			const deserializer = new VersionedTypeDeserializer(numberConfig)

			// Act
			const v1Result = deserializer.deserialize({
				version: 1,
				data: { value: 42 },
			})
			const v2Result = deserializer.deserialize({
				version: 2,
				data: { count: 5, multiplier: 3 },
			})

			// Assert
			expect(v1Result).toBe(42)
			expect(v2Result).toBe(15)
		})
	})
})
