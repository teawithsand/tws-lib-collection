import { PlayerEntry, PlayerEntryType } from "../player"

export interface AudioDurationLoader {
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
