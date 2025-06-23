import { Fs } from "../defines/fs"
import { InMemoryFs } from "../inMemory/fs"
import { OpfsFs } from "../opfs/fs"

/**
 * Available file system types for testing.
 */
export enum FsType {
	IN_MEMORY = "in-memory",
	OPFS = "opfs",
}

/**
 * Test file system instance with cleanup capability.
 */
export interface TestFs {
	/** The file system instance */
	readonly fs: Fs
	/** Cleanup function to remove all data and release resources */
	readonly release: () => Promise<void>
}

/**
 * Creates a test file system instance based on the specified type.
 *
 * @param type - The type of file system to create
 * @returns Promise that resolves to a TestFs instance with cleanup capability
 *
 * @example
 * ```typescript
 * // Create an in-memory file system for testing
 * const testFs = await createTestFs(FsType.IN_MEMORY)
 *
 * // Use the file system
 * const rootDir = await testFs.fs.getRootDir()
 * await rootDir.openFile("test.txt", { create: true })
 *
 * // Clean up when done
 * await testFs.release()
 * ```
 *
 * @example
 * ```typescript
 * // Create an OPFS file system for testing
 * const testFs = await createTestFs(FsType.OPFS)
 *
 * // Use the file system
 * const rootDir = await testFs.fs.getRootDir()
 * await rootDir.mkdir("testdir")
 *
 * // Clean up when done (removes all test data)
 * await testFs.release()
 * ```
 */
export const createTestFs = async (type: FsType): Promise<TestFs> => {
	switch (type) {
		case FsType.IN_MEMORY:
			return await createInMemoryTestFs()

		case FsType.OPFS:
			return await createOpfsTestFs()

		default:
			throw new Error(`Unsupported file system type: ${type}`)
	}
}

/**
 * Creates an in-memory test file system.
 * The cleanup function is a no-op since in-memory data is automatically garbage collected.
 */
const createInMemoryTestFs = async (): Promise<TestFs> => {
	const fs = new InMemoryFs()

	return {
		fs,
		release: async () => {
			// In-memory file system doesn't need explicit cleanup
			// Data will be garbage collected when the instance is no longer referenced
		},
	}
}

/**
 * Creates an OPFS test file system with a unique test directory.
 * The cleanup function removes all test data from the OPFS.
 */
const createOpfsTestFs = async (): Promise<TestFs> => {
	// Check if OPFS is available in the current environment
	if (typeof navigator === "undefined" || !navigator.storage?.getDirectory) {
		throw new Error(
			"OPFS (Origin Private File System) is not available in this environment",
		)
	}

	// Get the OPFS root directory
	const opfsRoot = await navigator.storage.getDirectory()

	// Create a unique test directory to avoid conflicts between tests
	const testDirName = `test-${Date.now()}-${Math.random().toString(36).substring(2)}`
	const testDirectory = await opfsRoot.getDirectoryHandle(testDirName, {
		create: true,
	})

	// Import OPFS implementation
	const fs = new OpfsFs(testDirectory)

	return {
		fs,
		release: async () => {
			await opfsRoot.removeEntry(testDirName, { recursive: true })
		},
	}
}
