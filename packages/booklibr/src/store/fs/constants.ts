import { Path } from "@teawithsand/fstate"

/** Header file containing audiobook metadata and aggregate data */
export const FS_STORE_HEADER_FILE = Path.fromSegment("header.json")

/** Directory name for storing audiobook entries */
export const FS_STORE_ENTRIES_DIR = Path.fromSegment("entries")

/** File extension for entry metadata files */
export const FS_STORE_ENTRY_DATA_EXTENSION = ".data"

/** File extension for entry blob (audio content) files */
export const FS_STORE_ENTRY_BLOB_EXTENSION = ".blob"

/**
 * Creates a path for an entry data file
 * @param entryId - The unique identifier for the entry
 * @returns Path to the entry data file
 */
export const createEntryDataPath = (entryId: string): Path =>
	Path.fromSegment(entryId + FS_STORE_ENTRY_DATA_EXTENSION)

/**
 * Creates a path for an entry blob file
 * @param entryId - The unique identifier for the entry
 * @returns Path to the entry blob file
 */
export const createEntryBlobPath = (entryId: string): Path =>
	Path.fromSegment(entryId + FS_STORE_ENTRY_BLOB_EXTENSION)
