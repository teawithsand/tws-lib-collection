import {
	FsDirHandle,
	FsFileHandle,
	InMemoryFs,
	Path,
} from "@teawithsand/fstate"
import { afterEach, describe, expect, test, vi } from "vitest"
import { FileAlreadyExistConflictResolutionType } from "../../../conflict"
import { FileManagerCopyConflictError } from "../../error"
import {
	applyFileConflictResolution,
	computeRenamedPath,
	resolveDirectoryFileConflict,
	resolveFileDirConflict,
	resolveFileFileConflict,
} from "../conflictResolution"

afterEach(() => {
	vi.restoreAllMocks()
})

const setupHandles = async (): Promise<{
	readonly inputFile: FsFileHandle
	readonly existingFile: FsFileHandle
	readonly existingDir: FsDirHandle
}> => {
	const fs = new InMemoryFs()
	const root = await fs.getRootDir()
	const inputFile = await root.openFile(Path.fromSegment("input.txt"), {
		create: true,
	})
	const existingFile = await root.openFile(Path.fromSegment("existing.txt"), {
		create: true,
	})
	const existingDir = await root.openDir(Path.fromSegment("existingDir"), {
		create: true,
	})

	return { inputFile, existingFile, existingDir }
}

describe("conflictResolution helpers", () => {
	test("applies file conflict resolution strategies", () => {
		const targetPath = Path.parse("dir/file.txt")

		expect(() =>
			applyFileConflictResolution(
				{ type: FileAlreadyExistConflictResolutionType.ERROR },
				targetPath,
			),
		).toThrow(FileManagerCopyConflictError)

		expect(
			applyFileConflictResolution(
				{ type: FileAlreadyExistConflictResolutionType.SKIP },
				targetPath,
			),
		).toBeNull()

		expect(
			applyFileConflictResolution(
				{
					type: FileAlreadyExistConflictResolutionType.RENAME,
					newFileName: "new.txt",
				},
				targetPath,
			)?.toString(),
		).toBe("dir/new.txt")

		expect(
			applyFileConflictResolution(
				{ type: FileAlreadyExistConflictResolutionType.OVERWRITE },
				targetPath,
			)?.toString(),
		).toBe("dir/file.txt")
	})

	test("computes renamed paths with and without parent", () => {
		expect(
			computeRenamedPath(
				Path.fromSegment("old.txt"),
				"fresh.txt",
			).toString(),
		).toBe("fresh.txt")
		expect(
			computeRenamedPath(Path.parse("a/b.txt"), "c.txt").toString(),
		).toBe("a/c.txt")
	})

	test("resolves file-file conflicts through resolver", async () => {
		const { inputFile, existingFile } = await setupHandles()
		const resolver = {
			resolveFileAlreadyExistConflict: vi.fn().mockResolvedValue({
				type: FileAlreadyExistConflictResolutionType.SKIP,
			}),
		}

		const result = await resolveFileFileConflict(
			inputFile,
			existingFile,
			Path.parse("existing.txt"),
			resolver,
		)

		expect(resolver.resolveFileAlreadyExistConflict).toHaveBeenCalledWith(
			inputFile,
			existingFile,
		)
		expect(result).toBeNull()
	})

	test("resolves file-directory conflicts with supported strategies", async () => {
		const { inputFile, existingDir } = await setupHandles()
		const resolverSkip = {
			resolveFileAlreadyExistConflict: vi.fn().mockResolvedValue({
				type: FileAlreadyExistConflictResolutionType.SKIP,
			}),
		}
		const skipResult = await resolveFileDirConflict(
			inputFile,
			existingDir,
			Path.parse("existingDir"),
			resolverSkip,
		)
		expect(skipResult).toBeNull()

		const resolverRename = {
			resolveFileAlreadyExistConflict: vi.fn().mockResolvedValue({
				type: FileAlreadyExistConflictResolutionType.RENAME,
				newFileName: "renamed.txt",
			}),
		}
		const renamed = await resolveFileDirConflict(
			inputFile,
			existingDir,
			Path.parse("existingDir"),
			resolverRename,
		)
		expect(renamed?.toString()).toBe("renamed.txt")

		const resolverOverwrite = {
			resolveFileAlreadyExistConflict: vi.fn().mockResolvedValue({
				type: FileAlreadyExistConflictResolutionType.OVERWRITE,
			}),
		}
		await expect(
			resolveFileDirConflict(
				inputFile,
				existingDir,
				Path.parse("existingDir"),
				resolverOverwrite,
			),
		).rejects.toBeInstanceOf(FileManagerCopyConflictError)
	})

	test("resolves directory-file conflicts", async () => {
		const { existingFile } = await setupHandles()
		const resolverError = {
			resolveFileAlreadyExistConflict: vi.fn().mockResolvedValue({
				type: FileAlreadyExistConflictResolutionType.ERROR,
			}),
		}
		await expect(
			resolveDirectoryFileConflict(
				existingFile,
				Path.parse("existing.txt"),
				resolverError,
			),
		).rejects.toBeInstanceOf(FileManagerCopyConflictError)

		const resolverSkip = {
			resolveFileAlreadyExistConflict: vi.fn().mockResolvedValue({
				type: FileAlreadyExistConflictResolutionType.SKIP,
			}),
		}
		await expect(
			resolveDirectoryFileConflict(
				existingFile,
				Path.parse("existing.txt"),
				resolverSkip,
			),
		).resolves.toBe(false)
	})
})
