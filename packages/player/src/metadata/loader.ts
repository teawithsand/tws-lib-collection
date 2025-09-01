import { PlayerEntry, PlayerEntryType } from "../player"

/**
 * Interface for loading audio duration metadata from various player entry sources.
 */
export interface AudioDurationLoader {
	/**
	 * Loads the duration of an audio file.
	 *
	 * @param src - The player entry (URL or Blob) to extract duration from
	 * @returns Promise that resolves to the duration in seconds (floating point)
	 *
	 * @remarks
	 * - The returned duration is in seconds, matching the HTML Audio element's duration property
	 * - For invalid or non-audio sources, may return NaN or throw an error
	 * - Duration is a floating-point number allowing for fractional seconds
	 *
	 * @example
	 * ```typescript
	 * const loader = new AudioDurationLoaderImpl();
	 * const duration = await loader.loadDuration({
	 *   type: PlayerEntryType.URL,
	 *   url: "audio.mp3"
	 * });
	 * console.log(`Duration: ${duration} seconds`);
	 * ```
	 */
	loadDuration: (src: PlayerEntry) => Promise<number>
}

export class AudioDurationLoaderImpl implements AudioDurationLoader {
	constructor() {}

	public readonly loadDuration = async (
		source: PlayerEntry,
	): Promise<number> => {
		let url = ""

		let release: () => void = () => {}

		if (source.type === PlayerEntryType.URL) {
			url = source.url
		} else if (source.type === PlayerEntryType.BLOB) {
			url = URL.createObjectURL(source.blob)
			release = () => {
				URL.revokeObjectURL(url)
			}
		}

		const resultPromise = new Promise<number>((resolve, reject) => {
			const audio = new Audio()

			const onLoadedMetadata = () => {
				cleanup()
				resolve(audio.duration ?? NaN)
			}

			const onError = (e: ErrorEvent) => {
				e.stopPropagation()
				e.preventDefault()
				cleanup()
				reject(e.error)
			}

			const cleanup = () => {
				audio.removeEventListener("loadedmetadata", onLoadedMetadata)
				audio.removeEventListener("error", onError)
			}

			audio.addEventListener("loadedmetadata", onLoadedMetadata)
			audio.addEventListener("error", onError)

			audio.src = url
			audio.load()
		})

		try {
			return await resultPromise
		} finally {
			release()
		}
	}
}
