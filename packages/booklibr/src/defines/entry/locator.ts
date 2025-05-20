/**
 * Describes the methods by which an Address Book (ABook) entry can be located.
 */
export enum ABookEntryLocatorType {
	/**
	 * The entry is located within the internal object storage system,
	 * accessible via a unique identifier.
	 */
	INTERNAL_OBJECT_STORAGE = 1,

	/**
	 * The entry is located by an external URL.
	 */
	URL = 2,
}

/**
 * Represents a locator for an Address Book entry, specifying how to find it.
 */
export type ABookEntryLocator =
	| {
			/**
			 * Specifies that the ABook entry is located in internal object storage.
			 */
			type: ABookEntryLocatorType.INTERNAL_OBJECT_STORAGE

			/**
			 * Unique identifier of the entry within the internal storage.
			 */
			id: string
	  }
	| {
			/**
			 * Specifies that the ABook entry is located via an external URL.
			 */
			type: ABookEntryLocatorType.URL

			/**
			 * The URL where the entry can be accessed.
			 */
			url: string
	  }
