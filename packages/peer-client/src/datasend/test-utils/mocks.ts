import { FileReader, FileSource } from "../reader/fileReader"
import { FileReceiverHandler, FileWriter } from "../writer/fileWriter"

/**
 * Test data interfaces
 */
export interface TestGlobalHeader {
	transferId: string
	totalFiles: number
	maxFileSize?: number
}

export interface TestFileHeader {
	fileName: string
	fileSize: number
}

/**
 * Mock file reader for testing
 */
export class MockFileReader implements FileReader {
	private chunks: ArrayBuffer[]
	private currentIndex = 0
	private closed = false

	constructor(chunks: ArrayBuffer[]) {
		this.chunks = chunks
	}

	public readonly readChunk = async (): Promise<ArrayBuffer | null> => {
		if (this.closed) {
			throw new Error("Reader is closed")
		}
		if (this.currentIndex >= this.chunks.length) {
			return null
		}
		const chunk = this.chunks[this.currentIndex++]
		return chunk || null
	}

	public readonly close = async (): Promise<void> => {
		this.closed = true
	}

	public readonly isClosed = (): boolean => {
		return this.closed
	}
}

/**
 * Mock file writer for testing
 */
export class MockFileWriter implements FileWriter {
	private chunks: ArrayBuffer[] = []
	private closed = false

	public readonly writeChunk = async (chunk: ArrayBuffer): Promise<void> => {
		if (this.closed) {
			throw new Error("Writer is closed")
		}
		this.chunks.push(chunk)
	}

	public readonly close = async (): Promise<void> => {
		this.closed = true
	}

	public readonly getChunks = (): ArrayBuffer[] => {
		return this.chunks
	}

	public readonly getTotalBytes = (): number => {
		return this.chunks.reduce((total, chunk) => total + chunk.byteLength, 0)
	}

	public readonly isClosed = (): boolean => {
		return this.closed
	}
}

/**
 * Mock file source for testing
 */
export class MockFileSource implements FileSource<TestFileHeader> {
	private files: Array<{ reader: FileReader; header: TestFileHeader }>
	private currentIndex = 0
	private closed = false

	constructor(files: Array<{ reader: FileReader; header: TestFileHeader }>) {
		this.files = files
	}

	public readonly next = async (): Promise<{
		reader: FileReader
		header: TestFileHeader
	} | null> => {
		if (this.closed) {
			throw new Error("File source is closed")
		}
		if (this.currentIndex >= this.files.length) {
			return null
		}
		const file = this.files[this.currentIndex++]
		return file || null
	}

	public readonly close = async (): Promise<void> => {
		this.closed = true
	}

	public readonly isClosed = (): boolean => {
		return this.closed
	}
}

/**
 * Mock file receiver handler for testing
 */
export class MockFileReceiverHandler
	implements FileReceiverHandler<TestGlobalHeader, TestFileHeader>
{
	private writers: MockFileWriter[] = []
	private closed = false

	public readonly createFileWriter = async (
		_globalHeader: TestGlobalHeader,
		_fileHeader: TestFileHeader,
		_fileIndex: number,
	): Promise<FileWriter> => {
		if (this.closed) {
			throw new Error("Handler is closed")
		}
		const writer = new MockFileWriter()
		this.writers.push(writer)
		return writer
	}

	public readonly close = async (): Promise<void> => {
		this.closed = true
	}

	public readonly getWriters = (): MockFileWriter[] => {
		return this.writers
	}

	public readonly isClosed = (): boolean => {
		return this.closed
	}
}

/**
 * Slow file reader that simulates network delays
 */
export class SlowFileReader implements FileReader {
	private reader: MockFileReader
	private delay: number

	constructor(chunks: ArrayBuffer[], delay: number = 100) {
		this.reader = new MockFileReader(chunks)
		this.delay = delay
	}

	public readonly readChunk = async (): Promise<ArrayBuffer | null> => {
		await new Promise((resolve) => setTimeout(resolve, this.delay))
		return this.reader.readChunk()
	}

	public readonly close = async (): Promise<void> => {
		return this.reader.close()
	}
}

/**
 * Failing file reader that throws errors
 */
export class FailingFileReader implements FileReader {
	private chunks: ArrayBuffer[]
	private currentIndex = 0
	private failAfterChunks: number

	constructor(chunks: ArrayBuffer[], failAfterChunks: number = 1) {
		this.chunks = chunks
		this.failAfterChunks = failAfterChunks
	}

	public readonly readChunk = async (): Promise<ArrayBuffer | null> => {
		if (this.currentIndex >= this.failAfterChunks) {
			throw new Error("Simulated read failure")
		}
		if (this.currentIndex >= this.chunks.length) {
			return null
		}
		const chunk = this.chunks[this.currentIndex++]
		return chunk || null
	}

	public readonly close = async (): Promise<void> => {}
}

/**
 * Failing file writer that throws errors
 */
export class FailingFileWriter implements FileWriter {
	private failAfterBytes: number
	private bytesWritten = 0

	constructor(failAfterBytes: number = 100) {
		this.failAfterBytes = failAfterBytes
	}

	public readonly writeChunk = async (chunk: ArrayBuffer): Promise<void> => {
		this.bytesWritten += chunk.byteLength
		if (this.bytesWritten > this.failAfterBytes) {
			throw new Error("Simulated write failure")
		}
	}

	public readonly close = async (): Promise<void> => {}
}

/**
 * Utility to create test data
 */
export class TestDataUtils {
	public static readonly createChunk = (
		size: number,
		fill = 0,
	): ArrayBuffer => {
		const buffer = new ArrayBuffer(size)
		const view = new Uint8Array(buffer)
		view.fill(fill)
		return buffer
	}

	public static readonly createChunks = (
		sizes: number[],
		fillValues?: number[],
	): ArrayBuffer[] => {
		return sizes.map((size, index) =>
			this.createChunk(size, fillValues?.[index] ?? index),
		)
	}

	public static readonly compareBuffers = (
		a: ArrayBuffer,
		b: ArrayBuffer,
	): boolean => {
		if (a.byteLength !== b.byteLength) {
			return false
		}
		const viewA = new Uint8Array(a)
		const viewB = new Uint8Array(b)
		for (let i = 0; i < viewA.length; i++) {
			if (viewA[i] !== viewB[i]) {
				return false
			}
		}
		return true
	}

	public static readonly concatenateBuffers = (
		buffers: ArrayBuffer[],
	): ArrayBuffer => {
		const totalLength = buffers.reduce(
			(sum, buffer) => sum + buffer.byteLength,
			0,
		)
		const result = new ArrayBuffer(totalLength)
		const resultView = new Uint8Array(result)
		let offset = 0
		for (const buffer of buffers) {
			const view = new Uint8Array(buffer)
			resultView.set(view, offset)
			offset += buffer.byteLength
		}
		return result
	}
}
