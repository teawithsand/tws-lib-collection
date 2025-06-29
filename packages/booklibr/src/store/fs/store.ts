import { FsDirHandle, FsHandleType } from "@teawithsand/fstate"
import { generateUuid, TypeAssert } from "@teawithsand/lngext"
import { SerializerReverse } from "@teawithsand/reserd"
import {
	AbookAggregateData,
	AbookEntryAggregateData,
	AbookEntryData,
	AbookHeaderData,
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

export class FsAbookStore implements AbookStore {
	constructor(private readonly config: FsAbookStoreConfig) {}

	public readonly createAbook = async (
		data: AbookHeaderData,
	): Promise<AbookHandle> => {
		const id = generateUuid()
		return await FsAbookHandle.create(id, this.config, data)
	}

	public readonly listAbooks = async (): Promise<AbookHandle[]> => {
		const entries = (await this.config.root.stat()).entries

		return entries
			.filter((entry) => entry.type === FsHandleType.DIR)
			.map((entry) =>
				entry.type === FsHandleType.DIR
					? (entry as FsDirHandle)
					: TypeAssert.unreachable(),
			)
			.map((handle) => new FsAbookHandle(this.config, handle))
	}
}
