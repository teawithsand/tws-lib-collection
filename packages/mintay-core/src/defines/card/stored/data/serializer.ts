import { SdelkaCardData } from "../../sdelkaCardData"
import { StoredSdelkaCardData } from "./schema"

const neverGuard = (value: never): never => {
	throw new Error(`Unsupported version: ${value}`)
}

export class StoredSdelkaCardDataSerializer {
	private constructor() {}

	public static readonly serialize = (
		data: SdelkaCardData,
	): StoredSdelkaCardData => {
		return {
			version: 1,
			data: {
				globalId: data.globalId,
				content: data.content,
				createdAtTimestamp: data.createdAtTimestamp,
				lastUpdatedAtTimestamp: data.lastUpdatedAtTimestamp,
			},
		}
	}

	public static readonly deserialize = (
		storedData: StoredSdelkaCardData,
	): SdelkaCardData => {
		if (storedData.version === 1) {
			const d = storedData.data
			return {
				globalId: d.globalId,
				content: d.content,
				createdAtTimestamp: d.createdAtTimestamp,
				lastUpdatedAtTimestamp: d.lastUpdatedAtTimestamp,
			}
		}
		return neverGuard(storedData.version)
	}
}
