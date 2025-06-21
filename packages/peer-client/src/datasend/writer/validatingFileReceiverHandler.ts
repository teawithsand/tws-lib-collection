import { FileReceiverHandler, FileWriter } from "./fileWriter"

/**
 * Configuration for file size and count validation
 */
export interface ValidationConfig<TGlobalHeader, TFileHeader> {
	/**
	 * Extract the expected or maximum file count from the global header
	 * @param globalHeader - The global transfer header
	 * @returns Expected file count, maximum file count, or null if no validation needed
	 */
	readonly extractFileCount: (
		globalHeader: TGlobalHeader,
	) => { expected?: number; max?: number } | null

	/**
	 * Extract the expected or maximum size for a specific file
	 * @param globalHeader - The global transfer header
	 * @param fileHeader - The specific file header
	 * @param fileIndex - The index of the file (0-based)
	 * @returns Expected file size, maximum file size, or null if no validation needed
	 */
	readonly extractFileSize: (
		globalHeader: TGlobalHeader,
		fileHeader: TFileHeader,
		fileIndex: number,
	) => { expected?: number; max?: number } | null
}

/**
 * Validating wrapper that tracks file sizes and counts to ensure they meet expectations
 */
export class ValidatingFileReceiverHandler<TGlobalHeader, TFileHeader>
	implements FileReceiverHandler<TGlobalHeader, TFileHeader>
{
	private globalHeader: TGlobalHeader | null = null
	private fileCount = 0
	private fileSizes: number[] = []
	private fileValidations: Array<{ expected?: number; max?: number } | null> =
		[]

	constructor(
		private readonly wrappedHandler: FileReceiverHandler<
			TGlobalHeader,
			TFileHeader
		>,
		private readonly validationConfig: ValidationConfig<
			TGlobalHeader,
			TFileHeader
		>,
	) {}

	/**
	 * Create a file writer for the incoming file with size validation
	 */
	public readonly createFileWriter = async (
		globalHeader: TGlobalHeader,
		fileHeader: TFileHeader,
		fileIndex: number,
	): Promise<FileWriter> => {
		if (this.globalHeader === null) {
			this.globalHeader = globalHeader
		}
		this.fileCount = fileIndex + 1
		const fileValidation = this.validationConfig.extractFileSize(
			globalHeader,
			fileHeader,
			fileIndex,
		)
		this.fileValidations[fileIndex] = fileValidation
		const wrappedWriter = await this.wrappedHandler.createFileWriter(
			globalHeader,
			fileHeader,
			fileIndex,
		)

		return new ValidatingFileWriter(
			wrappedWriter,
			fileIndex,
			this.fileSizes,
			fileValidation,
		)
	}

	/**
	 * Close the receiver handler and validate all expectations
	 */
	public readonly close = async (): Promise<void> => {
		try {
			if (this.globalHeader) {
				const countValidation = this.validationConfig.extractFileCount(
					this.globalHeader,
				)
				if (countValidation) {
					if (
						countValidation.expected !== undefined &&
						this.fileCount !== countValidation.expected
					) {
						throw new Error(
							`Expected ${countValidation.expected} files, but received ${this.fileCount}`,
						)
					}
					if (
						countValidation.max !== undefined &&
						this.fileCount > countValidation.max
					) {
						throw new Error(
							`Received ${this.fileCount} files, which exceeds maximum of ${countValidation.max}`,
						)
					}
				}
			}

			for (let i = 0; i < this.fileSizes.length; i++) {
				const fileSize = this.fileSizes[i]
				const validation = this.fileValidations[i]

				if (validation && fileSize !== undefined) {
					if (
						validation.expected !== undefined &&
						fileSize !== validation.expected
					) {
						throw new Error(
							`File ${i}: expected ${validation.expected} bytes, but received ${fileSize} bytes`,
						)
					}
					if (
						validation.max !== undefined &&
						fileSize > validation.max
					) {
						throw new Error(
							`File ${i}: received ${fileSize} bytes, which exceeds maximum of ${validation.max} bytes`,
						)
					}
				}
			}

			await this.wrappedHandler.close()
		} catch (error) {
			try {
				await this.wrappedHandler.close()
			} catch {}
			throw error
		}
	}
}

/**
 * File writer wrapper that tracks bytes written for validation
 */
class ValidatingFileWriter implements FileWriter {
	private bytesWritten = 0

	constructor(
		private readonly wrappedWriter: FileWriter,
		private readonly fileIndex: number,
		private readonly fileSizes: number[],
		private readonly validation: { expected?: number; max?: number } | null,
	) {}

	/**
	 * Write a chunk and track the size
	 */
	public readonly writeChunk = async (chunk: ArrayBuffer): Promise<void> => {
		this.bytesWritten += chunk.byteLength

		if (
			this.validation?.max !== undefined &&
			this.bytesWritten > this.validation.max
		) {
			throw new Error(
				`File ${this.fileIndex}: size ${this.bytesWritten} bytes exceeds maximum of ${this.validation.max} bytes`,
			)
		}

		await this.wrappedWriter.writeChunk(chunk)
	}

	/**
	 * Close the writer and record final size
	 */
	public readonly close = async (): Promise<void> => {
		this.fileSizes[this.fileIndex] = this.bytesWritten

		await this.wrappedWriter.close()
	}
}
