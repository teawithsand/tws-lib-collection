import { describe, expect, test } from "vitest"
import { InMemoryFileSource } from "./inMemoryFileSource.js"

interface TestFileHeader {
	name: string
	size: number
	type: string
}

describe("InMemoryFileSource", () => {
	const createArrayBuffer = (content: string): ArrayBuffer => {
		return new TextEncoder().encode(content).buffer
	}

	const createBlob = (content: string, type = "text/plain"): Blob => {
		return new Blob([content], { type })
	}

	const arrayBufferToString = (buffer: ArrayBuffer): string => {
		return new TextDecoder().decode(buffer)
	}

	const createTestHeader = (
		name: string,
		size: number,
		type = "text/plain",
	): TestFileHeader => ({
		name,
		size,
		type,
	})

	test("should provide files from ArrayBuffer data", async () => {
		const data1 = createArrayBuffer("file1 content")
		const data2 = createArrayBuffer("file2 content")
		const files: Array<[TestFileHeader, ArrayBuffer]> = [
			[createTestHeader("file1.txt", data1.byteLength), data1],
			[createTestHeader("file2.txt", data2.byteLength), data2],
		]
		const source = new InMemoryFileSource(files, 5)

		const file1 = await source.next()
		const file2 = await source.next()
		const file3 = await source.next()

		expect(file1).not.toBeNull()
		expect(file1!.header.name).toBe("file1.txt")
		expect(file2).not.toBeNull()
		expect(file2!.header.name).toBe("file2.txt")
		expect(file3).toBeNull()

		const chunks1: string[] = []
		let chunk = await file1!.reader.readChunk()
		while (chunk) {
			chunks1.push(arrayBufferToString(chunk))
			chunk = await file1!.reader.readChunk()
		}
		expect(chunks1.join("")).toBe("file1 content")

		const chunks2: string[] = []
		chunk = await file2!.reader.readChunk()
		while (chunk) {
			chunks2.push(arrayBufferToString(chunk))
			chunk = await file2!.reader.readChunk()
		}
		expect(chunks2.join("")).toBe("file2 content")
	})

	test("should provide files from Blob data", async () => {
		const blob1 = createBlob("blob1 content", "text/plain")
		const blob2 = createBlob("blob2 content", "application/json")
		const files: Array<[TestFileHeader, Blob]> = [
			[createTestHeader("file1.txt", blob1.size), blob1],
			[
				createTestHeader("file2.json", blob2.size, "application/json"),
				blob2,
			],
		]
		const source = new InMemoryFileSource(files)

		const file1 = await source.next()
		const file2 = await source.next()
		const file3 = await source.next()

		expect(file1).not.toBeNull()
		expect(file1!.header.name).toBe("file1.txt")
		expect(file1!.header.type).toBe("text/plain")
		expect(file2).not.toBeNull()
		expect(file2!.header.name).toBe("file2.json")
		expect(file2!.header.type).toBe("application/json")
		expect(file3).toBeNull()
	})

	test("should handle mixed ArrayBuffer and Blob data", async () => {
		const arrayBuffer = createArrayBuffer("array content")
		const blob = createBlob("blob content")
		const files: Array<[TestFileHeader, ArrayBuffer | Blob]> = [
			[
				createTestHeader("array.txt", arrayBuffer.byteLength),
				arrayBuffer,
			],
			[createTestHeader("blob.txt", blob.size), blob],
		]
		const source = new InMemoryFileSource(files, 10)

		const file1 = await source.next()
		const file2 = await source.next()

		expect(file1).not.toBeNull()
		expect(file2).not.toBeNull()

		const chunks1: string[] = []
		let chunk = await file1!.reader.readChunk()
		while (chunk) {
			chunks1.push(arrayBufferToString(chunk))
			chunk = await file1!.reader.readChunk()
		}
		const content1 = chunks1.join("")

		const chunks2: string[] = []
		chunk = await file2!.reader.readChunk()
		while (chunk) {
			chunks2.push(arrayBufferToString(chunk))
			chunk = await file2!.reader.readChunk()
		}
		const content2 = chunks2.join("")

		expect(content1).toBe("array content")
		expect(content2).toBe("blob content")
	})

	test("should handle empty files array", async () => {
		const source = new InMemoryFileSource<TestFileHeader>([])

		const file = await source.next()

		expect(file).toBeNull()
	})

	test("should handle single file", async () => {
		const data = createArrayBuffer("single file content")
		const files: Array<[TestFileHeader, ArrayBuffer]> = [
			[createTestHeader("single.txt", data.byteLength), data],
		]
		const source = new InMemoryFileSource(files)

		const file1 = await source.next()
		const file2 = await source.next()

		expect(file1).not.toBeNull()
		expect(file1!.header.name).toBe("single.txt")
		expect(file2).toBeNull()
	})

	test("should use custom chunk size for readers", async () => {
		const largeContent = "x".repeat(100)
		const data = createArrayBuffer(largeContent)
		const files: Array<[TestFileHeader, ArrayBuffer]> = [
			[createTestHeader("large.txt", data.byteLength), data],
		]
		const customChunkSize = 13
		const source = new InMemoryFileSource(files, customChunkSize)

		const file = await source.next()

		expect(file).not.toBeNull()

		const chunks: string[] = []
		let chunk = await file!.reader.readChunk()
		while (chunk) {
			chunks.push(arrayBufferToString(chunk))
			chunk = await file!.reader.readChunk()
		}

		for (let i = 0; i < chunks.length - 1; i++) {
			const chunk = chunks[i]
			expect(chunk).toBeDefined()
			expect(chunk!.length).toBe(customChunkSize)
		}
		expect(chunks.join("")).toBe(largeContent)
	})

	test("should use default chunk size when not specified", async () => {
		const largeContent = "a".repeat(100000)
		const data = createArrayBuffer(largeContent)
		const files: Array<[TestFileHeader, ArrayBuffer]> = [
			[createTestHeader("large.txt", data.byteLength), data],
		]
		const source = new InMemoryFileSource(files)

		const file = await source.next()

		expect(file).not.toBeNull()

		const firstChunk = await file!.reader.readChunk()
		expect(firstChunk).not.toBeNull()
		expect(firstChunk!.byteLength).toBe(65536)
	})

	test("should handle files with empty data", async () => {
		const emptyBuffer = new ArrayBuffer(0)
		const emptyBlob = new Blob([])
		const normalData = createArrayBuffer("normal")
		const files: Array<[TestFileHeader, ArrayBuffer | Blob]> = [
			[createTestHeader("empty1.txt", 0), emptyBuffer],
			[createTestHeader("empty2.txt", 0), emptyBlob],
			[createTestHeader("normal.txt", normalData.byteLength), normalData],
		]
		const source = new InMemoryFileSource(files)

		const file1 = await source.next()
		const file2 = await source.next()
		const file3 = await source.next()
		const file4 = await source.next()

		expect(file1).not.toBeNull()
		expect(file2).not.toBeNull()
		expect(file3).not.toBeNull()
		expect(file4).toBeNull()

		const chunk1 = await file1!.reader.readChunk()
		expect(chunk1!.byteLength).toBe(0)

		const chunk2 = await file2!.reader.readChunk()
		expect(chunk2!.byteLength).toBe(0)

		const chunk3 = await file3!.reader.readChunk()
		expect(arrayBufferToString(chunk3!)).toBe("normal")
	})

	test("should maintain correct order of files", async () => {
		const files: Array<[TestFileHeader, ArrayBuffer]> = []
		for (let i = 0; i < 10; i++) {
			const data = createArrayBuffer(`file${i}`)
			files.push([
				createTestHeader(`file${i}.txt`, data.byteLength),
				data,
			])
		}
		const source = new InMemoryFileSource(files)

		const retrievedFiles: { header: TestFileHeader; content: string }[] = []
		let file = await source.next()
		while (file) {
			const content = arrayBufferToString(
				(await file.reader.readChunk())!,
			)
			retrievedFiles.push({ header: file.header, content })
			file = await source.next()
		}

		expect(retrievedFiles).toHaveLength(10)
		for (let i = 0; i < 10; i++) {
			const file = retrievedFiles[i]
			expect(file).toBeDefined()
			expect(file!.header.name).toBe(`file${i}.txt`)
			expect(file!.content).toBe(`file${i}`)
		}
	})

	test("should handle headers with complex data", async () => {
		interface ComplexHeader {
			id: number
			metadata: {
				created: string
				tags: string[]
			}
			permissions: {
				read: boolean
				write: boolean
			}
		}

		const data = createArrayBuffer("complex data")
		const complexHeader: ComplexHeader = {
			id: 12345,
			metadata: {
				created: "2025-06-21",
				tags: ["important", "test"],
			},
			permissions: {
				read: true,
				write: false,
			},
		}
		const files: Array<[ComplexHeader, ArrayBuffer]> = [
			[complexHeader, data],
		]
		const source = new InMemoryFileSource(files)

		const file = await source.next()

		expect(file).not.toBeNull()
		expect(file!.header.id).toBe(12345)
		expect(file!.header.metadata.tags).toEqual(["important", "test"])
		expect(file!.header.permissions.read).toBe(true)
		expect(file!.header.permissions.write).toBe(false)
	})

	test("should create independent readers for each file", async () => {
		const data1 = createArrayBuffer("file1")
		const data2 = createArrayBuffer("file2")
		const files: Array<[TestFileHeader, ArrayBuffer]> = [
			[createTestHeader("file1.txt", data1.byteLength), data1],
			[createTestHeader("file2.txt", data2.byteLength), data2],
		]
		const source = new InMemoryFileSource(files)

		const file1 = await source.next()
		const file2 = await source.next()

		expect(file1).not.toBeNull()
		expect(file2).not.toBeNull()

		await file1!.reader.close()
		const content2 = arrayBufferToString((await file2!.reader.readChunk())!)
		expect(content2).toBe("file2")

		const content1AfterClose = await file1!.reader.readChunk()
		expect(content1AfterClose).toBeNull()
	})
})
