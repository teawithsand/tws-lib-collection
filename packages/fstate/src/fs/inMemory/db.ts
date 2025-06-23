import { FsErrorBadType } from "../defines/error"
import { Path } from "../defines/path"

// In-memory file system node definitions

/**
 * Base type for all in-memory file system nodes.
 */
export type InMemoryNode = InMemoryFileNode | InMemoryDirNode

/**
 * In-memory file node. File nodes always have a parent directory.
 */
export type InMemoryFileNode = {
	readonly type: "file"
	name: string
	parent: InMemoryDirNode
	content: Blob
	deleted: boolean
}

/**
 * In-memory directory node.
 */
export type InMemoryDirNode = {
	readonly type: "directory"
	name: string
	parent: InMemoryDirNode | null
	entries: Map<string, InMemoryNode>
	deleted: boolean
}

/**
 * Utility class for in-memory node operations (type guards, etc.).
 */
export class InMemoryNodeUtil {
	private constructor() {}

	/**
	 * Type guard for file node.
	 */
	public static readonly isFileNode = (
		node: InMemoryNode,
	): node is InMemoryFileNode => node.type === "file"

	/**
	 * Type guard for directory node.
	 */
	public static readonly isDirNode = (
		node: InMemoryNode,
	): node is InMemoryDirNode => node.type === "directory"

	/**
	 * Creates a new empty root directory node.
	 */
	public static readonly createEmptyRootDir = (): InMemoryDirNode => {
		return {
			type: "directory",
			name: "",
			parent: null,
			entries: new Map<string, InMemoryNode>(),
			deleted: false,
		}
	}

	/**
	 * Returns the entry for a given path starting from the provided directory node.
	 * @param startNode The directory node to start from
	 * @param path The path to traverse (Path instance or string)
	 * @returns The found InMemoryNode, or undefined if not found
	 */
	public static readonly getEntryByPath = (
		startNode: InMemoryDirNode,
		path: Path | string,
	): InMemoryNode | undefined => {
		const pathObj = path instanceof Path ? path : new Path(path)
		const segments = pathObj.getSegments()
		let current: InMemoryNode = startNode
		for (const segment of segments) {
			if (!InMemoryNodeUtil.isDirNode(current))
				throw new FsErrorBadType(
					"Expected directory node in path traversal",
				)
			const next: InMemoryNode | undefined = current.entries.get(segment)
			if (!next) return undefined
			current = next
		}
		return current
	}

	/**
	 * Creates or sets an entry at the given path, with options for override and directory creation.
	 * @param startNode The directory node to start from
	 * @param path The path to traverse (Path instance or string)
	 * @param options.entry The entry to set at the final segment
	 * @param options.override Whether to override an existing entry (default: false)
	 * @param options.createDirs Whether to create missing directories along the path (default: false)
	 * @throws FsErrorBadType if a file is found where a directory is expected, or if type mismatch on override
	 */
	public static readonly createEntryByPath = (
		startNode: InMemoryDirNode,
		path: Path | string,
		options: {
			entry: InMemoryNode
			override?: boolean
			createDirs?: boolean
		},
	): void => {
		const pathObj = path instanceof Path ? path : new Path(path)
		const segments = pathObj.getSegments()
		if (segments.length === 0)
			throw new FsErrorBadType("Cannot create entry at root path")
		let current: InMemoryNode = startNode
		for (let i = 0; i < segments.length - 1; ++i) {
			const segment = segments[i]!
			if (!InMemoryNodeUtil.isDirNode(current))
				throw new FsErrorBadType(
					"Expected directory node in path traversal",
				)
			let next: InMemoryNode | undefined = current.entries.get(segment)
			if (!next) {
				if (options.createDirs) {
					const newDir: InMemoryDirNode = {
						type: "directory",
						name: segment,
						parent: current,
						entries: new Map(),
						deleted: false,
					}
					current.entries.set(segment, newDir)
					next = newDir
				} else {
					throw new FsErrorBadType(
						"Missing directory in path and createDirs is false",
					)
				}
			}
			if (!InMemoryNodeUtil.isDirNode(next))
				throw new FsErrorBadType(
					"Expected directory node in path traversal",
				)
			current = next
		}
		// Now current is the parent dir for the final segment
		if (!InMemoryNodeUtil.isDirNode(current))
			throw new FsErrorBadType(
				"Expected directory node at parent of final segment",
			)
		const finalSegment = segments[segments.length - 1]!
		const existing = current.entries.get(finalSegment)
		if (existing) {
			if (!options.override)
				throw new FsErrorBadType(
					"Entry already exists and override is false",
				)

			const existingIsDir = InMemoryNodeUtil.isDirNode(existing)
			const newIsDir = InMemoryNodeUtil.isDirNode(options.entry)

			if (existingIsDir && newIsDir) {
				return
			} else if (!existingIsDir && !newIsDir) {
				// noop; do override
			} else {
				throw new FsErrorBadType(
					"Cannot override file with dir or dir with file",
				)
			}
		}
		options.entry.name = finalSegment
		options.entry.parent = current
		current.entries.set(finalSegment, options.entry)
	}

	/**
	 * Removes an entry from its parent directory and marks it and all its children as deleted.
	 * @param node The node to remove
	 * @throws FsErrorBadType if trying to remove the root directory
	 */
	public static readonly removeEntryByPath = (node: InMemoryNode): void => {
		// Cannot remove root directory
		if (node.parent === null) {
			throw new FsErrorBadType("Cannot remove root directory")
		}

		// Remove from parent's entries
		node.parent.entries.delete(node.name)

		// Mark the node as deleted
		node.deleted = true

		// If it's a directory, recursively mark all children as deleted
		if (InMemoryNodeUtil.isDirNode(node)) {
			InMemoryNodeUtil.markChildrenAsDeleted(node)
		}
	}

	/**
	 * Recursively marks all children of a directory as deleted.
	 * @param dirNode The directory node whose children should be marked as deleted
	 */
	private static readonly markChildrenAsDeleted = (
		dirNode: InMemoryDirNode,
	): void => {
		for (const child of dirNode.entries.values()) {
			child.deleted = true
			if (InMemoryNodeUtil.isDirNode(child)) {
				InMemoryNodeUtil.markChildrenAsDeleted(child)
			}
		}
	}
}
