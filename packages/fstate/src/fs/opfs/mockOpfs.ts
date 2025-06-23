/**
 * Mock implementation of FileSystem interfaces for testing OPFS functionality.
 *
 * This provides a simplified in-memory mock that mimics the OPFS API structure
 * while allowing for comprehensive testing without requiring a browser environment.
 */

interface MockEntry {
	name: string
	kind: "file" | "directory"
	content?: Blob
	children?: Map<string, MockEntry>
}

/**
 * Creates a mock FileSystemDirectoryHandle with in-memory storage for testing.
 */
export function createMockDirectoryHandle(
	name = "root",
	entries: Map<string, MockEntry> = new Map(),
): FileSystemDirectoryHandle {
	return {
		name,
		kind: "directory",

		async *entries() {
			for (const [entryName, entry] of entries) {
				if (entry.kind === "directory") {
					yield [
						entryName,
						createMockDirectoryHandle(
							entryName,
							entry.children ?? new Map(),
						),
					]
				} else {
					yield [entryName, createMockFileHandle(entryName, entry)]
				}
			}
		},

		async getDirectoryHandle(
			dirName: string,
			options?: { create?: boolean },
		) {
			const existing = entries.get(dirName)

			if (existing) {
				if (existing.kind !== "directory") {
					throw new DOMException("TypeMismatchError")
				}
				return createMockDirectoryHandle(
					dirName,
					existing.children ?? new Map(),
				)
			}

			if (!options?.create) {
				throw new DOMException("NotFoundError")
			}

			// Create new directory
			const newEntry: MockEntry = {
				name: dirName,
				kind: "directory",
				children: new Map(),
			}
			entries.set(dirName, newEntry)

			return createMockDirectoryHandle(dirName, newEntry.children!)
		},

		async getFileHandle(fileName: string, options?: { create?: boolean }) {
			const existing = entries.get(fileName)

			if (existing) {
				if (existing.kind !== "file") {
					throw new DOMException("TypeMismatchError")
				}
				return createMockFileHandle(fileName, existing)
			}

			if (!options?.create) {
				throw new DOMException("NotFoundError")
			}

			// Create new file
			const newEntry: MockEntry = {
				name: fileName,
				kind: "file",
				content: new Blob([]),
			}
			entries.set(fileName, newEntry)

			return createMockFileHandle(fileName, newEntry)
		},

		async removeEntry(
			entryName: string,
			options?: { recursive?: boolean },
		) {
			const existing = entries.get(entryName)

			if (!existing) {
				throw new DOMException("NotFoundError")
			}

			if (
				existing.kind === "directory" &&
				existing.children?.size &&
				!options?.recursive
			) {
				throw new DOMException("InvalidModificationError")
			}

			entries.delete(entryName)
		},
	} as unknown as FileSystemDirectoryHandle
}

/**
 * Creates a mock FileSystemFileHandle with in-memory storage for testing.
 */
export function createMockFileHandle(
	name: string,
	entry: MockEntry,
): FileSystemFileHandle {
	return {
		name,
		kind: "file",

		async getFile() {
			return new File([entry.content ?? new Blob([])], name)
		},

		async createWritable(options?: { keepExistingData?: boolean }) {
			const chunks: (ArrayBuffer | Blob)[] = []

			if (options?.keepExistingData && entry.content) {
				chunks.push(entry.content)
			}

			return {
				async write(data: ArrayBuffer | Blob) {
					chunks.push(data)
				},

				async seek(_newPosition: number) {
					// Mock implementation - position tracking not needed for basic tests
				},

				async close() {
					entry.content = new Blob(chunks)
				},
			} as unknown as FileSystemWritableFileStream
		},
	} as unknown as FileSystemFileHandle
}
