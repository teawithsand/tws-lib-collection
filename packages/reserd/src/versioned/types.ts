/**
 * Type representing a mapping of version numbers to their corresponding data types.
 * Each key is a version number and each value is the data structure for that version.
 * This serves as a foundation for building versioned type systems.
 */
export type VersionedTypeDataMap = Record<number, any>

/**
 * Union type that creates versioned storage objects with version and data fields.
 * Transforms a version data map into a discriminated union of objects where each has
 * a version field and a data field containing the corresponding version's data structure.
 * This is the core type for representing versioned data in storage.
 *
 * @template T - The versioned data map
 */
export type VersionedStorageObject<T extends VersionedTypeDataMap> = {
	[K in keyof T]: {
		version: K
		data: T[K]
	}
}[keyof T]
