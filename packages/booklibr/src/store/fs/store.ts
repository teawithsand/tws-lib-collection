import { FsDirHandle, FsHandleType, Path } from "@teawithsand/fstate"
import { generateUuid } from "@teawithsand/lngext"
import { SerializerReverse } from "@teawithsand/reserd"
import {
	AbookAggregateData,
	AbookEntryAggregateData,
	AbookEntryData,
	AbookHeaderData,
	Id,
} from "../../defines"
import { AbookHandle, AbookStore } from "../defines"
import { AbookAggregator } from "../defines/abookHandle"
import { AbookEntryAggregator } from "../defines/entryHandle"
import { FsAbookHandle } from "./fsAbookHandle"

export type FsAbookStoreAbookData = {
	aggregate: AbookAggregateData
	header: AbookHeaderData
}

export type FsAbookStoreAbookEntryData = {
	aggregate: AbookEntryAggregateData
	data: AbookEntryData
}

export type FsAbookStoreConfig = {
	root: FsDirHandle
	abookSerializer: SerializerReverse<FsAbookStoreAbookData, ArrayBuffer>
	abookEntrySerializer: SerializerReverse<
		FsAbookStoreAbookEntryData,
		ArrayBuffer
	>
	abookAggregator: AbookAggregator
	abookEntryAggregator: AbookEntryAggregator
}

/**
 * File system implementation of AbookStore.
 */
export class FsAbookStore implements AbookStore {
	private readonly config: FsAbookStoreConfig

	constructor(config: FsAbookStoreConfig) {
		this.config = config
	}

	public readonly createAbook = async (
		data: AbookHeaderData,
	): Promise<AbookHandle> => {
		const id = generateUuid()
		return await FsAbookHandle.create(id, this.config, data)
	}

	public readonly listAbooks = async (): Promise<AbookHandle[]> => {
		const stat = await this.config.root.stat()

		return stat.entries
			.filter((entry) => entry.type === FsHandleType.DIR)
			.map((entry) => this.createAbookHandle(entry as FsDirHandle))
	}

	public readonly get = async (id: Id): Promise<AbookHandle> => {
		const idStr = id.toString()
		try {
			const abookDir = await this.config.root.openDir(Path.from(idStr))
			const exists = await abookDir.exists()
			if (exists) {
				return FsAbookHandle.fromExisting(this.config, abookDir)
			}
		} catch {
			// Directory doesn't exist, fall through to create non-existent handle
		}
		return FsAbookHandle.createNonExistent(this.config, idStr)
	}

	private readonly createAbookHandle = (
		dirHandle: FsDirHandle,
	): FsAbookHandle => {
		return FsAbookHandle.fromExisting(this.config, dirHandle)
	}
}
