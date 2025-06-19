import { describe, expect, test } from "vitest"
import { z } from "zod"
import { VersionedType } from "./versionedType"

describe("VersionedType", () => {
	type OwnedType = {
		id: number
		name: string
		email?: string
	}

	type Version1Data = {
		id: number
		name: string
	}

	type Version2Data = {
		id: number
		name: string
		email: string
	}

	type VersionedData = {
		1: Version1Data
		2: Version2Data
	}

	test("end-to-end data flow with multiple versions", () => {
		const deserializerConfig = {
			1: {
				schema: z.object({ id: z.number(), name: z.string() }),
				deserializer: (data: Version1Data): OwnedType => ({
					id: data.id,
					name: data.name,
				}),
			},
			2: {
				schema: z.object({
					id: z.number(),
					name: z.string(),
					email: z.string(),
				}),
				deserializer: (data: Version2Data): OwnedType => ({
					id: data.id,
					name: data.name,
					email: data.email,
				}),
			},
		}

		const versionedType = new VersionedType<VersionedData, OwnedType>({
			serializer: (owned: OwnedType) => ({
				version: 2 as const,
				data: {
					id: owned.id,
					name: owned.name,
					email: owned.email || "default@example.com",
				} as Version2Data,
			}),
			deserializer: deserializerConfig,
		})

		// Test roundtrip with current version (v2)
		const modernObject: OwnedType = {
			id: 456,
			name: "Modern User",
			email: "user@example.com",
		}
		const serializedModern = versionedType.serialize(modernObject)
		const deserializedModern = versionedType.deserialize(serializedModern)
		expect(deserializedModern).toEqual(modernObject)

		// Test deserializing legacy version (v1)
		const legacyStoredData = {
			version: 1 as const,
			data: { id: 123, name: "Legacy User" } as Version1Data,
		}
		const deserializedLegacy = versionedType.deserialize(legacyStoredData)
		expect(deserializedLegacy).toEqual({ id: 123, name: "Legacy User" })
	})
})
