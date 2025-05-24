/**
 * Represents a versioned object with a numeric version identifier.
 * Used as a base type for stored versioned data structures.
 */
export type VersionedStored = { version: number }

/**
 * A mapping of version numbers to deserializer functions.
 * Each deserializer function converts a specific version of a stored type to its owned counterpart.
 *
 * @template TStored - The stored type that extends {@link VersionedStored}
 * @template TOwned - The owned type that the stored type will be deserialized into
 */
export type DeserializerSet<TStored extends VersionedStored, TOwned> = {
	[K in TStored["version"]]: (
		stored: Extract<TStored, { version: K }>,
	) => TOwned
}

/**
 * A class that manages the deserialization of versioned stored types into their owned counterparts.
 * This enables backward compatibility with different versions of stored data structures.
 *
 * @template TStored - The stored type that extends {@link VersionedStored}
 * @template TOwned - The owned type that the stored type will be deserialized into
 */
export class VersionedDeserializer<TStored extends VersionedStored, TOwned> {
	private readonly deserializers: DeserializerSet<TStored, TOwned>

	/**
	 * Private constructor for the Deserializer class.
	 * Use {@link VersionedDeserializer.create} to instantiate.
	 *
	 * @param deserializers - Set of version-specific deserializer functions
	 */
	private constructor({
		deserializers,
	}: {
		deserializers: DeserializerSet<TStored, TOwned>
	}) {
		this.deserializers = deserializers
	}

	/**
	 * Creates a new instance of the Deserializer class.
	 *
	 * @template TStored - The stored type that extends {@link VersionedStored}
	 * @template TOwned - The owned type that the stored type will be deserialized into
	 * @param deserializers - Set of version-specific deserializer functions
	 * @returns A new Deserializer instance
	 */
	public static create<TStored extends VersionedStored, TOwned>({
		deserializers,
	}: {
		deserializers: DeserializerSet<TStored, TOwned>
	}): VersionedDeserializer<TStored, TOwned> {
		return new VersionedDeserializer({ deserializers })
	}

	/**
	 * Deserializes a versioned stored object into its owned counterpart.
	 * Automatically selects the appropriate deserializer based on the version.
	 *
	 * @param stored - The versioned stored object to deserialize
	 * @returns The deserialized owned object
	 * @throws Error if no deserializer is found for the given version
	 */
	public readonly deserialize = (stored: TStored): TOwned => {
		const version = stored.version as TStored["version"]
		const deserializer = this.deserializers[version]

		if (!deserializer) {
			throw new Error(
				`No deserializer for version ${version}; This should never happen when types are correct.`,
			)
		}

		return deserializer(
			stored as Extract<TStored, { version: typeof version }>,
		)
	}
}
