import {
	FsDirHandle,
	FsErrorNotFound,
	InMemoryFs,
	Path,
} from "@teawithsand/fstate"
import { afterEach, describe, expect, test, vi } from "vitest"
import { FileAlreadyExistConflictResolutionType } from "../../../conflict"
import { FileManagerCopyConflictError } from "../../error"
import {
	checkDirectoryConflict,
	checkFileConflict,
	handleDirectoryConflict,
	resolveFileOutputPath,
} from "../conflictChecking"

afterEach(() => {
	vi.restoreAllMocks()
})

describe("conflictChecking helpers", () => {
	test("detects file conflicts and delegates to resolver", async () => {
		const fs = new InMemoryFs()
		const root = await fs.getRootDir()
		const outputDir = await root.openDir(Path.fromSegment("output"), {
			create: true,
		})
		const inputFile = await root.openFile(Path.fromSegment("input.txt"), {
			create: true,
		})
		await outputDir.openFile(Path.fromSegment("input.txt"), {
			create: true,
		})

		const resolver = {
			resolveFileAlreadyExistConflict: vi.fn().mockResolvedValue({
				type: FileAlreadyExistConflictResolutionType.RENAME,
				newFileName: "renamed.txt",
			}),
		}

		const result = await checkFileConflict(
			inputFile,
			outputDir,
			Path.parse("input.txt"),
			resolver,
		)

		expect(resolver.resolveFileAlreadyExistConflict).toHaveBeenCalled()
		expect(result?.toString()).toBe("renamed.txt")
	})

	test("errors when rename target file already exists", async () => {
		const fs = new InMemoryFs()
		const root = await fs.getRootDir()
		const outputDir = await root.openDir(Path.fromSegment("output"), {
			create: true,
		})
		const inputFile = await root.openFile(Path.fromSegment("input.txt"), {
			create: true,
		})
		await outputDir.openFile(Path.fromSegment("input.txt"), {
			create: true,
		})
		await outputDir.openFile(Path.fromSegment("renamed.txt"), {
			create: true,
		})

		await expect(
			resolveFileOutputPath(
				inputFile,
				outputDir,
				Path.parse("input.txt"),
				{
					resolveFileAlreadyExistConflict: async () => ({
						type: FileAlreadyExistConflictResolutionType.RENAME,
						newFileName: "renamed.txt",
					}),
				},
			),
		).rejects.toBeInstanceOf(FileManagerCopyConflictError)
	})

	test("errors when rename target directory already exists", async () => {
		const fs = new InMemoryFs()
		const root = await fs.getRootDir()
		const outputDir = await root.openDir(Path.fromSegment("output"), {
			create: true,
		})
		const inputFile = await root.openFile(Path.fromSegment("input.txt"), {
			create: true,
		})
		await outputDir.openFile(Path.fromSegment("input.txt"), {
			create: true,
		})
		await outputDir.openDir(Path.fromSegment("renamed"), { create: true })

		await expect(
			resolveFileOutputPath(
				inputFile,
				outputDir,
				Path.parse("input.txt"),
				{
					resolveFileAlreadyExistConflict: async () => ({
						type: FileAlreadyExistConflictResolutionType.RENAME,
						newFileName: "renamed",
					}),
				},
			),
		).rejects.toBeInstanceOf(FileManagerCopyConflictError)
	})

	test("returns undefined when no file exists at target", async () => {
		const fs = new InMemoryFs()
		const root = await fs.getRootDir()
		const outputDir = await root.openDir(Path.fromSegment("output"), {
			create: true,
		})
		const inputFile = await root.openFile(Path.fromSegment("input.txt"), {
			create: true,
		})

		const resolver = {
			resolveFileAlreadyExistConflict: vi.fn(),
		}

		const result = await checkFileConflict(
			inputFile,
			outputDir,
			Path.parse("input.txt"),
			resolver,
		)

		expect(result).toBeUndefined()
	})

	test("detects directory conflicts for file creation", async () => {
		const fs = new InMemoryFs()
		const root = await fs.getRootDir()
		const outputDir = await root.openDir(Path.fromSegment("output"), {
			create: true,
		})
		const inputFile = await root.openFile(Path.fromSegment("input.txt"), {
			create: true,
		})
		await outputDir.openDir(Path.fromSegment("input.txt"), { create: true })

		const resolver = {
			resolveFileAlreadyExistConflict: vi.fn().mockResolvedValue({
				type: FileAlreadyExistConflictResolutionType.SKIP,
			}),
		}

		const result = await checkDirectoryConflict(
			inputFile,
			outputDir,
			Path.parse("input.txt"),
			resolver,
		)

		expect(resolver.resolveFileAlreadyExistConflict).toHaveBeenCalled()
		expect(result).toBeNull()
	})

	test("handles directory conflict error when file already exists at path", async () => {
		const fs = new InMemoryFs()
		const root = await fs.getRootDir()
		const outputDir = await root.openDir(Path.fromSegment("output"), {
			create: true,
		})
		await outputDir.openFile(Path.fromSegment("conflict"), { create: true })

		const resolver = {
			resolveFileAlreadyExistConflict: vi.fn().mockResolvedValue({
				type: FileAlreadyExistConflictResolutionType.ERROR,
			}),
		}

		await expect(
			handleDirectoryConflict(
				outputDir,
				Path.parse("conflict"),
				resolver,
			),
		).rejects.toBeInstanceOf(FileManagerCopyConflictError)

		const skipResolver = {
			resolveFileAlreadyExistConflict: vi.fn().mockResolvedValue({
				type: FileAlreadyExistConflictResolutionType.SKIP,
			}),
		}

		await expect(
			handleDirectoryConflict(
				outputDir,
				Path.parse("conflict"),
				skipResolver,
			),
		).resolves.toEqual({ shouldCreate: false, skipped: true })
	})

	test("resolves output path by checking file and directory conflicts", async () => {
		const fs = new InMemoryFs()
		const root = await fs.getRootDir()
		const outputDir = await root.openDir(Path.fromSegment("output"), {
			create: true,
		})
		const inputFile = await root.openFile(Path.fromSegment("input.txt"), {
			create: true,
		})
		await outputDir.openFile(Path.fromSegment("input.txt"), {
			create: true,
		})

		const resolverRename = {
			resolveFileAlreadyExistConflict: vi.fn().mockResolvedValue({
				type: FileAlreadyExistConflictResolutionType.RENAME,
				newFileName: "renamed.txt",
			}),
		}

		const renamedPath = await resolveFileOutputPath(
			inputFile,
			outputDir,
			Path.parse("input.txt"),
			resolverRename,
		)
		expect(renamedPath?.toString()).toBe("renamed.txt")

		const resolverNoConflict = {
			resolveFileAlreadyExistConflict: vi.fn().mockResolvedValue({
				type: FileAlreadyExistConflictResolutionType.OVERWRITE,
			}),
		}
		const freshPath = await resolveFileOutputPath(
			inputFile,
			outputDir,
			Path.parse("fresh.txt"),
			resolverNoConflict,
		)
		expect(freshPath?.toString()).toBe("fresh.txt")
	})

	test("propagates unexpected filesystem errors", async () => {
		const fs = new InMemoryFs()
		const root = await fs.getRootDir()
		const inputFile = await root.openFile(Path.fromSegment("input.txt"), {
			create: true,
		})

		const throwingOutput = {
			openFile: () => {
				throw new Error("boom")
			},
		} as unknown as FsDirHandle

		await expect(
			checkFileConflict(
				inputFile,
				throwingOutput,
				Path.parse("input.txt"),
				{
					resolveFileAlreadyExistConflict: vi.fn(),
				},
			),
		).rejects.toThrowError()

		const notFound = new FsErrorNotFound("missing")
		const fakeOutput = {
			openFile: () => {
				throw notFound
			},
		} as unknown as FsDirHandle

		await expect(
			checkFileConflict(inputFile, fakeOutput, Path.parse("input.txt"), {
				resolveFileAlreadyExistConflict: vi.fn(),
			}),
		).resolves.toBeUndefined()
	})
})
