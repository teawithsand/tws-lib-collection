import { InMemoryFs, Path } from "@teawithsand/fstate"
import { describe, expect, test } from "vitest"
import {
	discoverHandle,
	getDirectoryChildren,
	type DiscoveryResult,
} from "../discovery"

const collectPaths = (results: DiscoveryResult[]): string[] => {
	return results.map((item) => item.relativePath.toString()).sort()
}

describe("discovery helpers", () => {
	test("lists directory children with normalized relative paths", async () => {
		const fs = new InMemoryFs()
		const root = await fs.getRootDir()
		const parent = await root.openDir(Path.fromSegment("parent"), {
			create: true,
		})

		await parent.openFile(Path.parse("file.txt"), { create: true })
		await parent.openDir(Path.parse("child"), { create: true })

		const children = await getDirectoryChildren(
			parent,
			Path.fromSegment("parent"),
		)

		expect(children.map((child) => child.handle.name).sort()).toEqual([
			"child",
			"file.txt",
		])
		expect(
			children.map((child) => child.relativePath.toString()).sort(),
		).toEqual(["parent/child", "parent/file.txt"])
	})

	test("discovers files and directories breadth-first", async () => {
		const fs = new InMemoryFs()
		const root = await fs.getRootDir()
		const dir = await root.openDir(Path.fromSegment("source"), {
			create: true,
		})
		await dir.openDir(Path.parse("nested"), { create: true })
		await dir.openFile(Path.parse("note.txt"), { create: true })

		const results: DiscoveryResult[] = []
		let files = 0
		let dirs = 0

		await discoverHandle(
			dir,
			Path.fromSegment("source"),
			results,
			() => {
				return
			},
			() => {
				files += 1
			},
			() => {
				dirs += 1
			},
		)

		expect(files).toBe(1)
		expect(dirs).toBe(2)
		expect(collectPaths(results)).toEqual([
			"source",
			"source/nested",
			"source/note.txt",
		])
	})

	test("stops discovery when interruption is signaled", async () => {
		const fs = new InMemoryFs()
		const root = await fs.getRootDir()
		const file = await root.openFile(Path.fromSegment("halt.txt"), {
			create: true,
		})

		const results: DiscoveryResult[] = []
		const interruptionError = new Error("interrupted")

		await expect(
			discoverHandle(
				file,
				Path.fromSegment("halt.txt"),
				results,
				() => {
					throw interruptionError
				},
				() => {
					return
				},
				() => {
					return
				},
			),
		).rejects.toBe(interruptionError)
	})
})
