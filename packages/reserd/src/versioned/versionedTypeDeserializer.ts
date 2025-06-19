import { z } from "zod"
import type { VersionedStorageObject, VersionedTypeDataMap } from "./types"

/**
 * Configuration for a single version of versioned data.
 * Contains the schema for that version and a deserializer function.
 *
 * @template TSchema - The zod schema type for this version
 * @template TOwned - The target type that all versions should be deserialized to
 */
type VersionedTypeDeserializerConfigEntry<
	TSchema extends z.ZodSchema<any>,
	TOwned,
> = {
	schema: TSchema
	deserializer: (data: z.infer<TSchema>) => TOwned
}

/**
 * Infers type of data being deserialized from VersionedTypeDeserializer.
 */
export type VersionedTypeDeserializerInfer<
	T extends VersionedTypeDeserializer<any, any>,
> = Parameters<T["deserialize"]>[0]

/**
 * Configuration map for versioned data deserialization.
 * Each key is a version number and each value contains the schema and deserializer for that version.
 *
 * @template TVersionedData - The versioned data map representing all version types
 * @template TOwned - The target type that all versions should be deserialized to
 */
export type VersionedTypeDeserializerConfig<
	TVersionedData extends VersionedTypeDataMap,
	TOwned,
> = {
	[K in keyof TVersionedData]: VersionedTypeDeserializerConfigEntry<
		z.ZodSchema<TVersionedData[K]>,
		TOwned
	>
}

/**
 * Utility class for deserializing versioned data to a target type.
 * Handles multiple versions of data structures with their corresponding schemas and deserializers.
 *
 * @template TVersionedData - The versioned data map representing all version types
 * @template TOwned - The target type that all versions should be deserialized to
 */
export class VersionedTypeDeserializer<
	TVersionedData extends VersionedTypeDataMap,
	TOwned,
> {
	private readonly config: VersionedTypeDeserializerConfig<
		TVersionedData,
		TOwned
	>
	private readonly discriminatedUnionSchema: z.ZodDiscriminatedUnion<
		"version",
		z.ZodDiscriminatedUnionOption<"version">[]
	>

	/**
	 * Creates a new VersionedTypeDeserializer with the provided configuration.
	 *
	 * @param config - Configuration mapping version numbers to their schemas and deserializers
	 */
	constructor(
		config: VersionedTypeDeserializerConfig<TVersionedData, TOwned>,
	) {
		this.config = config
		this.discriminatedUnionSchema = this.createDiscriminatedUnionSchema()
	}

	/**
	 * Gets the properly typed schema for the versioned data based on the configuration.
	 * Returns a discriminated union schema that can parse VersionedStorageObject<TVersionedData>.
	 */
	public readonly getSchema = (): z.ZodType<
		VersionedStorageObject<TVersionedData>
	> => {
		// Type assertion is necessary here because the discriminated union schema we create
		// matches the VersionedStorageObject<TVersionedData> structure, but TypeScript cannot infer this
		// TBH I don't know why. That's why this method should be well unit-tested.
		return this.discriminatedUnionSchema as unknown as z.ZodType<
			VersionedStorageObject<TVersionedData>
		>
	}

	/**
	 * Creates a discriminated union schema from the version configurations.
	 * Each version becomes a union member with version and data fields.
	 */
	private readonly createDiscriminatedUnionSchema =
		(): z.ZodDiscriminatedUnion<
			"version",
			z.ZodDiscriminatedUnionOption<"version">[]
		> => {
			const versionSchemas = Object.entries(this.config).map(
				([version, versionConfig]) => {
					return z.object({
						version: z.literal(Number(version)),
						data: (
							versionConfig as VersionedTypeDeserializerConfigEntry<
								z.ZodSchema<any>,
								TOwned
							>
						).schema,
					})
				},
			)

			// Type assertion is necessary here because TypeScript cannot infer the exact tuple type
			// from the dynamic array creation, but we know the structure is correct for discriminated union
			return z.discriminatedUnion("version", versionSchemas as any)
		}

	/**
	 * Deserializes versioned data to the target type using the appropriate version's deserializer.
	 *
	 * @param input - The versioned data to deserialize
	 * @returns The deserialized data of type TOwned
	 * @throws Will throw if the input doesn't match any version schema or if deserialization fails
	 */
	public readonly deserialize = (input: unknown): TOwned => {
		const parsed = this.discriminatedUnionSchema.parse(input)
		const version = parsed.version as number
		const versionConfig = this.config[version]

		if (!versionConfig) {
			throw new Error(`No deserializer found for version ${version}`)
		}

		return versionConfig.deserializer(parsed["data"])
	}

	/**
	 * Deserializes versioned data to the target type using the appropriate version's deserializer.
	 *
	 * @param input - The versioned data to deserialize
	 * @returns The deserialized data of type TOwned
	 * @throws Will throw if the input doesn't match any version schema or if deserialization fails
	 */
	public readonly deserializedTyped = (
		input: VersionedStorageObject<TVersionedData>,
	): TOwned => {
		return this.deserialize(input as unknown)
	}
}
