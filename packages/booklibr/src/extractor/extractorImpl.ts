import {
	AudioDurationLoaderImpl,
	PlayerEntry,
	PlayerEntryType,
} from "@teawithsand/player"
import { SimpleSerializedError } from "@teawithsand/reserd"
import {
	AudioDurationExtractionError,
	BlobAudioMetadata,
	BlobImageMetadata,
	BlobMetadata,
	BlobMetadataExtractionTimeoutError,
	BlobMetadataExtractor,
	BlobMetadataResult,
	BlobMetadataResultType,
	ImageLoadError,
	InvalidAudioDurationError,
} from "../defines"

export type BlobMetadataExtractorImplOptions = {
	/**
	 * Timeout in milliseconds for extraction operations.
	 * If undefined or 0, no timeout is applied.
	 * Default: undefined (no timeout)
	 */
	readonly timeoutMs?: number
}

export class BlobMetadataExtractorImpl implements BlobMetadataExtractor {
	private readonly audioDurationLoader = new AudioDurationLoaderImpl()
	private readonly options: BlobMetadataExtractorImplOptions

	constructor(options: BlobMetadataExtractorImplOptions = {}) {
		if (
			options.timeoutMs &&
			(options.timeoutMs < 0 || !isFinite(options.timeoutMs))
		) {
			throw new Error(
				`Invalid timeoutMs value: ${options.timeoutMs}. Must be undefined, 0, or positive finite number`,
			)
		}
		this.options = options
	}

	public readonly extractFromUrl = async (
		url: string,
	): Promise<BlobMetadata> => {
		const extractionPromise = this.performExtractFromUrl(url)
		return this.withTimeout(extractionPromise)
	}

	/**
	 * Internal method that performs the actual extraction without timeout.
	 */
	private readonly performExtractFromUrl = async (
		url: string,
	): Promise<BlobMetadata> => {
		const imageMetadata = await this.extractImageMetadataFromUrl(url)
		const audioMetadata = await this.extractAudioMetadataFromUrl(url)

		return {
			image: imageMetadata,
			audio: audioMetadata,
		}
	}

	public readonly extractFromBlob = async (
		blob: Blob,
	): Promise<BlobMetadata> => {
		const extractionPromise = this.performExtractFromBlob(blob)
		return this.withTimeout(extractionPromise)
	}

	/**
	 * Internal method that performs the actual blob extraction without timeout.
	 */
	private readonly performExtractFromBlob = async (
		blob: Blob,
	): Promise<BlobMetadata> => {
		const url = URL.createObjectURL(blob)
		try {
			return await this.performExtractFromUrl(url)
		} finally {
			URL.revokeObjectURL(url)
		}
	}

	/**
	 * Extracts image metadata from an image URL.
	 * Returns width and height dimensions if the URL points to a valid image.
	 *
	 * @param url - The image URL to extract metadata from
	 * @returns Promise resolving to image metadata result
	 */
	private readonly extractImageMetadataFromUrl = async (
		url: string,
	): Promise<BlobMetadataResult<BlobImageMetadata>> => {
		try {
			const dimensions = await new Promise<{
				width: number
				height: number
			}>((resolve, reject) => {
				const img = new Image()

				const onLoad = () => {
					cleanup()
					resolve({
						width: img.naturalWidth,
						height: img.naturalHeight,
					})
				}

				const onError = () => {
					cleanup()
					reject(new ImageLoadError("Failed to load image from URL"))
				}

				const cleanup = () => {
					img.removeEventListener("load", onLoad)
					img.removeEventListener("error", onError)
				}

				img.addEventListener("load", onLoad)
				img.addEventListener("error", onError)
				img.src = url
			})

			return {
				type: BlobMetadataResultType.SUCCESS,
				metadata: dimensions,
			}
		} catch (error) {
			return {
				type: BlobMetadataResultType.ERROR,
				error: SimpleSerializedError.fromAny(error),
			}
		}
	}

	/**
	 * Extracts audio metadata from an audio URL.
	 * Returns duration if the URL points to a valid audio file.
	 *
	 * @param url - The audio URL to extract metadata from
	 * @returns Promise resolving to audio metadata result
	 */
	private readonly extractAudioMetadataFromUrl = async (
		url: string,
	): Promise<BlobMetadataResult<BlobAudioMetadata>> => {
		try {
			const playerEntry: PlayerEntry = {
				type: PlayerEntryType.URL,
				url,
			}

			const duration =
				await this.audioDurationLoader.loadDuration(playerEntry)

			if (isNaN(duration) || !isFinite(duration)) {
				return {
					type: BlobMetadataResultType.ERROR,
					error: SimpleSerializedError.fromAny(
						new InvalidAudioDurationError("Invalid audio duration"),
					),
				}
			}

			return {
				type: BlobMetadataResultType.SUCCESS,
				metadata: { duration },
			}
		} catch (error) {
			return {
				type: BlobMetadataResultType.ERROR,
				error: SimpleSerializedError.fromAny(
					new AudioDurationExtractionError(
						"Failed to extract audio duration",
						error,
					),
				),
			}
		}
	}

	/**
	 * Applies timeout to a promise if timeout is configured.
	 * Leaking promises is acceptable when timeout is exceeded.
	 *
	 * @param promise - The promise to apply timeout to
	 * @returns Promise that rejects with timeout error if timeout is exceeded
	 */
	private readonly withTimeout = <T>(promise: Promise<T>): Promise<T> => {
		if (!this.options.timeoutMs || this.options.timeoutMs <= 0) {
			return promise
		}

		return Promise.race([
			promise,
			new Promise<never>((_, reject) => {
				setTimeout(() => {
					reject(
						new BlobMetadataExtractionTimeoutError(
							`Operation timed out after ${this.options.timeoutMs}ms`,
						),
					)
				}, this.options.timeoutMs)
			}),
		])
	}
}
