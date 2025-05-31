import { z } from "zod"
import {
	DeserializerSet,
	VersionedDeserializer,
	VersionedStored,
} from "./deserializerSet"
import { Serializer, SimpleSerializer } from "./serializer"

/**
 * Helper function to create a versioned schema wrapper.
 * Automatically wraps a data schema with version information.
 *
 * @template TVersion - The version number type
 * @template TData - The data type for this version
 * @param version - The version number
 * @param dataSchema - The schema for the data at this version
 * @returns A schema that validates objects with version and data fields
 */
export const createVersionedSchema = <TVersion extends number, TData>(
	version: TVersion,
	dataSchema: z.ZodSchema<TData>,
) => {
	return z.object({
		version: z.literal(version),
		data: dataSchema,
	})
}

/**
 * Configuration for a single version of a stored type.
 * Combines schema validation with deserialization logic.
 *
 * @template TVersionedStored - The versioned stored type for this specific version
 * @template TOwned - The owned type
 */
export interface VersionConfig<
	TVersionedStored extends VersionedStored,
	TOwned,
> {
	readonly schema: z.ZodSchema<TVersionedStored>
	readonly deserializer: (stored: TVersionedStored) => TOwned
}

/**
 * Simplified version configuration that uses the helper function for schema creation.
 * Reduces duplication by automatically wrapping the data schema with version information.
 *
 * @template TVersion - The version number type
 * @template TData - The data type for this version
 * @template TOwned - The owned type
 */
export interface SimpleVersionConfig<TVersion extends number, TData, TOwned> {
	readonly dataSchema: z.ZodSchema<TData>
	readonly deserializer: (stored: {
		version: TVersion
		data: TData
	}) => TOwned
}

/**
 * Configuration mapping for all versions of a stored type.
 * Maps each version number to its corresponding version configuration.
 *
 * @template TStored - The union of all versioned stored types
 * @template TOwned - The owned type
 */
export type VersionConfigMap<TStored extends VersionedStored, TOwned> = {
	[K in TStored["version"]]: VersionConfig<
		Extract<TStored, { version: K }>,
		TOwned
	>
}

/**
 * Simplified configuration mapping that automatically handles schema versioning.
 * Maps each version number to its data schema and deserializer.
 *
 * @template TStored - The union of all versioned stored types that have a data property
 * @template TOwned - The owned type
 */
export type SimpleVersionConfigMap<
	TStored extends VersionedStored & { data: any },
	TOwned,
> = {
	[K in TStored["version"]]: SimpleVersionConfig<
		K,
		Extract<TStored, { version: K }>["data"],
		TOwned
	>
}

/**
 * Complete configuration for a versioned stored type.
 * Defines all version configurations and current serialization logic.
 * Current version is automatically inferred as the highest version number if not provided.
 *
 * @template TStored - The union of all versioned stored types
 * @template TOwned - The owned type
 */
export interface VersionedStoredTypeConfig<
	TStored extends VersionedStored,
	TOwned,
> {
	readonly versions: VersionConfigMap<TStored, TOwned>
	readonly currentSerializer: (
		owned: TOwned,
	) => Extract<TStored, { version: TStored["version"] }>
	readonly currentVersion?: TStored["version"]
}

/**
 * Simplified configuration that automatically handles schema versioning.
 * Uses SimpleVersionConfigMap to reduce duplication.
 * Current version is automatically inferred as the highest version number if not provided.
 *
 * @template TStored - The union of all versioned stored types that have a data property
 * @template TOwned - The owned type
 */
export interface SimpleVersionedStoredTypeConfig<
	TStored extends VersionedStored & { data: any },
	TOwned,
> {
	readonly versions: SimpleVersionConfigMap<TStored, TOwned>
	readonly currentSerializer: (
		owned: TOwned,
	) => Extract<TStored, { version: TStored["version"] }>
	readonly currentVersion?: TStored["version"]
}

/**
 * A complete encapsulation of a versioned stored type with schemas, serializers, and deserializers.
 * This class builds upon the existing VersionedDeserializer to provide a full-featured
 * versioned type management system with schema validation.
 *
 * @template TStored - The union of all versioned stored types
 * @template TOwned - The owned type
 */
export class VersionedStoredType<TStored extends VersionedStored, TOwned>
	implements Serializer<TStored, TOwned>
{
	private readonly config: VersionedStoredTypeConfig<TStored, TOwned>
	private readonly serializer: SimpleSerializer<TStored, TOwned>
	private readonly schema: z.ZodSchema<TStored>
	private readonly versionedDeserializer: VersionedDeserializer<
		TStored,
		TOwned
	>
	private readonly currentVersion: TStored["version"]

	/**
	 * Private constructor. Use {@link VersionedStoredType.create} to instantiate.
	 *
	 * @param config - Complete configuration for the versioned stored type
	 */
	private constructor({
		config,
	}: {
		config: VersionedStoredTypeConfig<TStored, TOwned>
	}) {
		this.config = config

		const versionNumbers = Object.keys(config.versions).map(Number)
		this.currentVersion =
			config.currentVersion ??
			(Math.max(...versionNumbers) as TStored["version"])

		const deserializers = Object.fromEntries(
			Object.entries(config.versions).map(([version, versionConfig]) => [
				Number(version),
				(versionConfig as VersionConfig<any, TOwned>).deserializer,
			]),
		) as DeserializerSet<TStored, TOwned>

		this.versionedDeserializer = VersionedDeserializer.create({
			deserializers,
		})

		this.serializer = SimpleSerializer.create({
			serializerFn: config.currentSerializer,
			deserializers: deserializers,
		}) as unknown as SimpleSerializer<TStored, TOwned>

		const versionSchemas = Object.values(config.versions).map(
			(v) => (v as VersionConfig<any, TOwned>).schema,
		)

		if (versionSchemas.length === 0) {
			throw new Error("At least one version must be configured")
		}

		if (versionSchemas.length === 1) {
			this.schema = versionSchemas[0] as z.ZodSchema<TStored>
		} else {
			this.schema = z.union(
				versionSchemas as [
					z.ZodSchema<any>,
					z.ZodSchema<any>,
					...z.ZodSchema<any>[],
				],
			) as z.ZodSchema<TStored>
		}
	}

	/**
	 * Creates a new VersionedStoredType instance using full configuration.
	 *
	 * @template TStored - The union of all versioned stored types
	 * @template TOwned - The owned type
	 * @param config - Complete configuration for the versioned stored type
	 * @returns A new VersionedStoredType instance
	 */
	public static readonly create = <TStored extends VersionedStored, TOwned>({
		config,
	}: {
		config: VersionedStoredTypeConfig<TStored, TOwned>
	}): VersionedStoredType<TStored, TOwned> => {
		return new VersionedStoredType({ config })
	} /**
	 * Creates a new VersionedStoredType instance using simplified configuration.
	 * Automatically wraps data schemas with version information.
	 *
	 * @template TStored - The union of all versioned stored types that have a data property
	 * @template TOwned - The owned type
	 * @param config - Simplified configuration for the versioned stored type
	 * @returns A new VersionedStoredType instance
	 */
	public static readonly createSimple = <
		TStored extends VersionedStored & { data: any },
		TOwned,
	>({
		config,
	}: {
		config: SimpleVersionedStoredTypeConfig<TStored, TOwned>
	}): VersionedStoredType<TStored, TOwned> => {
		const fullVersions = Object.fromEntries(
			Object.entries(config.versions).map(([version, simpleConfig]) => [
				version,
				{
					schema: createVersionedSchema(
						Number(version),
						(simpleConfig as SimpleVersionConfig<any, any, TOwned>)
							.dataSchema,
					),
					deserializer: (
						simpleConfig as SimpleVersionConfig<any, any, TOwned>
					).deserializer,
				},
			]),
		) as unknown as VersionConfigMap<TStored, TOwned>

		const fullConfig: VersionedStoredTypeConfig<TStored, TOwned> = {
			versions: fullVersions,
			currentSerializer: config.currentSerializer,
			...(config.currentVersion !== undefined && {
				currentVersion: config.currentVersion,
			}),
		}

		return new VersionedStoredType({ config: fullConfig })
	}

	/**
	 * Gets the underlying SimpleSerializer for this versioned stored type.
	 *
	 * @returns The SimpleSerializer instance
	 */
	public readonly getSerializer = (): SimpleSerializer<TStored, TOwned> => {
		return this.serializer
	}

	/**
	 * Gets the underlying VersionedDeserializer for this versioned stored type.
	 *
	 * @returns The VersionedDeserializer instance
	 */
	public readonly getVersionedDeserializer = (): VersionedDeserializer<
		TStored,
		TOwned
	> => {
		return this.versionedDeserializer
	}

	/**
	 * Gets the schema that validates any version of the stored type.
	 *
	 * @returns The union schema for all versions
	 */
	public readonly getSchema = (): z.ZodSchema<TStored> => {
		return this.schema
	}

	/**
	 * Gets the schema for a specific version.
	 *
	 * @template V - The version number
	 * @param version - The version number to get the schema for
	 * @returns The schema for the specified version
	 */
	public readonly getVersionSchema = <V extends TStored["version"]>(
		version: V,
	): z.ZodSchema<Extract<TStored, { version: V }>> => {
		return this.config.versions[version].schema
	}

	/**
	 * Gets the current version number (automatically inferred as the highest version if not provided).
	 *
	 * @returns The current version number
	 */
	public readonly getCurrentVersion = (): TStored["version"] => {
		return this.currentVersion
	}

	/**
	 * Serializes an owned object to the current version stored format.
	 *
	 * @param owned - The owned object to serialize
	 * @returns The serialized stored object
	 */
	public readonly serialize = (owned: TOwned): TStored => {
		return this.serializer.serialize(owned)
	}

	/**
	 * Deserializes a stored object to owned format.
	 * Uses the underlying VersionedDeserializer for version-aware deserialization.
	 *
	 * @param stored - The stored object to deserialize
	 * @returns The deserialized owned object
	 */
	public readonly deserialize = (stored: TStored): TOwned => {
		return this.versionedDeserializer.deserialize(stored)
	}

	/**
	 * Parses unknown data using the schema and then deserializes it.
	 * Combines schema validation with version-aware deserialization.
	 *
	 * @param data - The unknown data to parse and deserialize
	 * @returns The parsed and deserialized owned object
	 * @throws {z.ZodError} If the data doesn't match any version schema
	 */
	public readonly parseAndDeserialize = (data: unknown): TOwned => {
		const parsed = this.schema.parse(data)
		return this.deserialize(parsed)
	}
}
