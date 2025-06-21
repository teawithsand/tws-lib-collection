import { describe, expect, test } from "vitest"
import { FileReceiverHandler, FileWriter } from "./fileWriter"
import {
	ValidatingFileReceiverHandler,
	ValidationConfig,
} from "./validatingFileReceiverHandler"

interface TestGlobalHeader {
	expectedFileCount?: number
	maxFileCount?: number
}

interface TestFileHeader {
	expectedSize?: number
	maxSize?: number
	name: string
}

class MockFileWriter implements FileWriter {
	private chunks: ArrayBuffer[] = []

	public readonly writeChunk = async (chunk: ArrayBuffer): Promise<void> => {
		this.chunks.push(chunk)
	}

	public readonly close = async (): Promise<void> => {}

	public readonly getTotalSize = (): number => {
		return this.chunks.reduce((total, chunk) => total + chunk.byteLength, 0)
	}
}

class MockFileReceiverHandler
	implements FileReceiverHandler<TestGlobalHeader, TestFileHeader>
{
	private writers: MockFileWriter[] = []
	public closed = false

	public readonly createFileWriter = async (
		_globalHeader: TestGlobalHeader,
		_fileHeader: TestFileHeader,
		fileIndex: number,
	): Promise<FileWriter> => {
		const writer = new MockFileWriter()
		this.writers[fileIndex] = writer
		return writer
	}

	public readonly close = async (): Promise<void> => {
		this.closed = true
	}

	public readonly getWriter = (index: number): MockFileWriter => {
		const writer = this.writers[index]
		if (!writer) {
			throw new Error(`No writer found at index ${index}`)
		}
		return writer
	}
}

describe("ValidatingFileReceiverHandler", () => {
	test("should validate expected file count correctly", async () => {
		const mockHandler = new MockFileReceiverHandler()
		const validationConfig: ValidationConfig<
			TestGlobalHeader,
			TestFileHeader
		> = {
			extractFileCount: (globalHeader) =>
				globalHeader.expectedFileCount !== undefined
					? { expected: globalHeader.expectedFileCount }
					: null,
			extractFileSize: () => null,
		}

		const validator = new ValidatingFileReceiverHandler(
			mockHandler,
			validationConfig,
		)

		const globalHeader: TestGlobalHeader = { expectedFileCount: 2 }

		await validator.createFileWriter(globalHeader, { name: "file1" }, 0)
		await validator.createFileWriter(globalHeader, { name: "file2" }, 1)

		await expect(validator.close()).resolves.toBeUndefined()
		expect(mockHandler.closed).toBe(true)
	})

	test("should throw error when file count does not match expected", async () => {
		const mockHandler = new MockFileReceiverHandler()
		const validationConfig: ValidationConfig<
			TestGlobalHeader,
			TestFileHeader
		> = {
			extractFileCount: (globalHeader) =>
				globalHeader.expectedFileCount !== undefined
					? { expected: globalHeader.expectedFileCount }
					: null,
			extractFileSize: () => null,
		}

		const validator = new ValidatingFileReceiverHandler(
			mockHandler,
			validationConfig,
		)

		const globalHeader: TestGlobalHeader = { expectedFileCount: 3 }

		await validator.createFileWriter(globalHeader, { name: "file1" }, 0)
		await validator.createFileWriter(globalHeader, { name: "file2" }, 1)

		await expect(validator.close()).rejects.toThrow(
			"Expected 3 files, but received 2",
		)
		expect(mockHandler.closed).toBe(true)
	})

	test("should validate maximum file count correctly", async () => {
		const mockHandler = new MockFileReceiverHandler()
		const validationConfig: ValidationConfig<
			TestGlobalHeader,
			TestFileHeader
		> = {
			extractFileCount: (globalHeader) =>
				globalHeader.maxFileCount !== undefined
					? { max: globalHeader.maxFileCount }
					: null,
			extractFileSize: () => null,
		}

		const validator = new ValidatingFileReceiverHandler(
			mockHandler,
			validationConfig,
		)

		const globalHeader: TestGlobalHeader = { maxFileCount: 2 }

		await validator.createFileWriter(globalHeader, { name: "file1" }, 0)
		await validator.createFileWriter(globalHeader, { name: "file2" }, 1)
		await validator.createFileWriter(globalHeader, { name: "file3" }, 2)

		await expect(validator.close()).rejects.toThrow(
			"Received 3 files, which exceeds maximum of 2",
		)
	})

	test("should validate file sizes correctly", async () => {
		const mockHandler = new MockFileReceiverHandler()
		const validationConfig: ValidationConfig<
			TestGlobalHeader,
			TestFileHeader
		> = {
			extractFileCount: () => null,
			extractFileSize: (_globalHeader, fileHeader) => {
				const config: { expected?: number; max?: number } = {}
				if (fileHeader.expectedSize !== undefined)
					config.expected = fileHeader.expectedSize
				if (fileHeader.maxSize !== undefined)
					config.max = fileHeader.maxSize
				return Object.keys(config).length > 0 ? config : null
			},
		}

		const validator = new ValidatingFileReceiverHandler(
			mockHandler,
			validationConfig,
		)

		const globalHeader: TestGlobalHeader = {}
		const fileHeader: TestFileHeader = {
			name: "test.txt",
			expectedSize: 10,
		}

		const writer = await validator.createFileWriter(
			globalHeader,
			fileHeader,
			0,
		)
		const chunk = new ArrayBuffer(10)
		await writer.writeChunk(chunk)
		await writer.close()

		await expect(validator.close()).resolves.toBeUndefined()
	})

	test("should throw error when file size does not match expected", async () => {
		const mockHandler = new MockFileReceiverHandler()
		const validationConfig: ValidationConfig<
			TestGlobalHeader,
			TestFileHeader
		> = {
			extractFileCount: () => null,
			extractFileSize: (_globalHeader, fileHeader) =>
				fileHeader.expectedSize !== undefined
					? { expected: fileHeader.expectedSize }
					: null,
		}

		const validator = new ValidatingFileReceiverHandler(
			mockHandler,
			validationConfig,
		)

		const globalHeader: TestGlobalHeader = {}
		const fileHeader: TestFileHeader = {
			name: "test.txt",
			expectedSize: 10,
		}

		const writer = await validator.createFileWriter(
			globalHeader,
			fileHeader,
			0,
		)
		const chunk = new ArrayBuffer(5)
		await writer.writeChunk(chunk)
		await writer.close()

		await expect(validator.close()).rejects.toThrow(
			"File 0: expected 10 bytes, but received 5 bytes",
		)
	})

	test("should throw error when file size exceeds maximum during writing", async () => {
		const mockHandler = new MockFileReceiverHandler()
		const validationConfig: ValidationConfig<
			TestGlobalHeader,
			TestFileHeader
		> = {
			extractFileCount: () => null,
			extractFileSize: (_globalHeader, fileHeader) =>
				fileHeader.maxSize !== undefined
					? { max: fileHeader.maxSize }
					: null,
		}

		const validator = new ValidatingFileReceiverHandler(
			mockHandler,
			validationConfig,
		)

		const globalHeader: TestGlobalHeader = {}
		const fileHeader: TestFileHeader = { name: "test.txt", maxSize: 10 }

		const writer = await validator.createFileWriter(
			globalHeader,
			fileHeader,
			0,
		)
		const chunk1 = new ArrayBuffer(8)
		const chunk2 = new ArrayBuffer(5)

		await writer.writeChunk(chunk1)

		await expect(writer.writeChunk(chunk2)).rejects.toThrow(
			"File 0: size 13 bytes exceeds maximum of 10 bytes",
		)
	})

	test("should handle no validation configuration gracefully", async () => {
		const mockHandler = new MockFileReceiverHandler()
		const validationConfig: ValidationConfig<
			TestGlobalHeader,
			TestFileHeader
		> = {
			extractFileCount: () => null,
			extractFileSize: () => null,
		}

		const validator = new ValidatingFileReceiverHandler(
			mockHandler,
			validationConfig,
		)

		const globalHeader: TestGlobalHeader = {}
		const fileHeader: TestFileHeader = { name: "test.txt" }

		const writer = await validator.createFileWriter(
			globalHeader,
			fileHeader,
			0,
		)
		const chunk = new ArrayBuffer(100)
		await writer.writeChunk(chunk)
		await writer.close()

		await expect(validator.close()).resolves.toBeUndefined()
	})

	test("should close wrapped handler even when validation fails", async () => {
		const mockHandler = new MockFileReceiverHandler()
		const validationConfig: ValidationConfig<
			TestGlobalHeader,
			TestFileHeader
		> = {
			extractFileCount: (globalHeader) =>
				globalHeader.expectedFileCount !== undefined
					? { expected: globalHeader.expectedFileCount }
					: null,
			extractFileSize: () => null,
		}

		const validator = new ValidatingFileReceiverHandler(
			mockHandler,
			validationConfig,
		)

		const globalHeader: TestGlobalHeader = { expectedFileCount: 5 }

		await validator.createFileWriter(globalHeader, { name: "file1" }, 0)

		await expect(validator.close()).rejects.toThrow(
			"Expected 5 files, but received 1",
		)
		expect(mockHandler.closed).toBe(true)
	})
})
