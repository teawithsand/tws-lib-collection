import { MintayCollectionData } from "../../sdelkaCollectionData"
import { StoredMintayCollectionData } from "./schema"

const neverGuard = (value: never): never => {
	throw new Error(`Unsupported version: ${value}`)
}

export class StoredMintayCollectionDataSerializer {
	private constructor() {}

	public static readonly serialize = (
		data: MintayCollectionData,
	): StoredMintayCollectionData => {
		return {
			version: 1,
			data: {
				globalId: data.globalId,
				title: data.title,
				description: data.description,
				createdAtTimestamp: data.createdAtTimestamp,
				lastUpdatedAtTimestamp: data.lastUpdatedAtTimestamp,
			},
		}
	}

	public static readonly deserialize = (
		storedData: StoredMintayCollectionData,
	): MintayCollectionData => {
		if (storedData.version === 1) {
			const d = storedData.data
			return {
				globalId: d.globalId,
				title: d.title,
				description: d.description,
				createdAtTimestamp: d.createdAtTimestamp,
				lastUpdatedAtTimestamp: d.lastUpdatedAtTimestamp,
			}
		}
		return neverGuard(storedData.version)
	}
}
