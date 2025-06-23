import { FsErrorBadType, FsErrorNotFound } from "../defines/error"
import { FileHandle } from "../defines/fileHandle"
import { FileStatResult } from "../defines/fileStatResult"
import { Path } from "../defines/path"
import { FsWriteMode, FsWriteOptions, FsWriter } from "../defines/writer"
import { InMemoryDirNode, InMemoryNodeUtil } from "./db"
import { InMemoryFsWriter } from "./inMemoryFsWriter"

/**
 * In-memory implementation of FileHandle.
 */
export class InMemoryFileHandle implements FileHandle {
	private readonly rootNode: InMemoryDirNode
	private readonly filePath: Path

	public constructor({
		rootNode,
		filePath,
	}: {
		rootNode: InMemoryDirNode
		filePath: Path
	}) {
		this.rootNode = rootNode
		this.filePath = filePath
	}

	/**
	 * Name of the handle (basename of the path).
	 */
	public get name(): string {
		return this.filePath.basename() ?? ""
	}

	/**
	 * Path of the handle as a Path class instance.
	 */
	public get path(): Path {
		return this.filePath
	}

	/**
	 * Checks if the file exists.
	 */
	public readonly exists = async (): Promise<boolean> => {
		const node = InMemoryNodeUtil.getEntryByPath(
			this.rootNode,
			this.filePath,
		)
		return (
			node !== undefined &&
			InMemoryNodeUtil.isFileNode(node) &&
			!node.deleted
		)
	}

	/**
	 * Reads the entire file as a Uint8Array.
	 */
	public readonly read = async (): Promise<Uint8Array> => {
		const node = InMemoryNodeUtil.getEntryByPath(
			this.rootNode,
			this.filePath,
		)
		if (!node || node.deleted) {
			throw new FsErrorNotFound(
				`File not found: ${this.filePath.toString()}`,
			)
		}
		if (!InMemoryNodeUtil.isFileNode(node)) {
			throw new FsErrorBadType(
				`Expected file but found directory: ${this.filePath.toString()}`,
			)
		}

		const arrayBuffer = await node.content.arrayBuffer()
		return new Uint8Array(arrayBuffer)
	}

	/**
	 * Gets a File object representing the file.
	 */
	public readonly getFile = async (): Promise<File> => {
		const node = InMemoryNodeUtil.getEntryByPath(
			this.rootNode,
			this.filePath,
		)
		if (!node || node.deleted) {
			throw new FsErrorNotFound(
				`File not found: ${this.filePath.toString()}`,
			)
		}
		if (!InMemoryNodeUtil.isFileNode(node)) {
			throw new FsErrorBadType(
				`Expected file but found directory: ${this.filePath.toString()}`,
			)
		}

		const fileName = this.filePath.basename() ?? ""
		return new File([node.content], fileName)
	}

	/**
	 * Deletes the file.
	 */
	public readonly delete = async (): Promise<void> => {
		const node = InMemoryNodeUtil.getEntryByPath(
			this.rootNode,
			this.filePath,
		)
		if (!node || node.deleted) {
			throw new FsErrorNotFound(
				`File not found: ${this.filePath.toString()}`,
			)
		}
		if (!InMemoryNodeUtil.isFileNode(node)) {
			throw new FsErrorBadType(
				`Expected file but found directory: ${this.filePath.toString()}`,
			)
		}

		InMemoryNodeUtil.removeEntryByPath(node)
	}

	/**
	 * Gets stat info for the file.
	 */
	public readonly stat = async (): Promise<FileStatResult> => {
		const node = InMemoryNodeUtil.getEntryByPath(
			this.rootNode,
			this.filePath,
		)
		if (!node || node.deleted || !InMemoryNodeUtil.isFileNode(node)) {
			return { exists: false }
		}

		return {
			exists: true,
			size: node.content.size,
		}
	}

	/**
	 * Writes contents to this file.
	 *
	 * @param options Write options.
	 * @returns Writer for writing to the file.
	 */
	public readonly write = async (
		options?: FsWriteOptions,
	): Promise<FsWriter> => {
		const node = InMemoryNodeUtil.getEntryByPath(
			this.rootNode,
			this.filePath,
		)
		if (!node || node.deleted) {
			throw new FsErrorNotFound(
				`File not found: ${this.filePath.toString()}`,
			)
		}
		if (!InMemoryNodeUtil.isFileNode(node)) {
			throw new FsErrorBadType(
				`Expected file but found directory: ${this.filePath.toString()}`,
			)
		}

		const writerOptions: { fileNode: typeof node; mode?: FsWriteMode } = {
			fileNode: node,
		}
		if (options?.mode !== undefined) {
			writerOptions.mode = options.mode
		}

		return new InMemoryFsWriter(writerOptions)
	}
}
