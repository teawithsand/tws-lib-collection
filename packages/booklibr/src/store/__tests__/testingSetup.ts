import { InMemoryFs } from "@teawithsand/fstate"
import { TypeAssert } from "@teawithsand/lngext"
import {
	JsonEncoder,
	SerializerUtil,
	TextBufferEncoder,
} from "@teawithsand/reserd"
import { AbookStore } from "../defines"
import { AbookAggregator } from "../defines/abookHandle"
import { AbookEntryAggregator } from "../defines/entryHandle"
import {
	FsAbookStoreAbookDataSerializer,
	FsAbookStoreAbookEntryDataSerializer,
} from "../fs"
import { FsAbookStore } from "../fs/store"
import { InMemoryAbookStore } from "../inMemory"

/**
 * Available file system types for testing.
 */
export enum StoreType {
	IN_MEMORY = "in-memory",
	FS = "fs",
}

/**
 * Test file system instance with cleanup capability.
 */
export interface TestAbookStore {
	/** The store instance to use */
	readonly store: AbookStore
	/** Cleanup function to remove all data and release resources */
	readonly release: () => Promise<void>
	/** Mock abook aggregator for testing */
	readonly abookAggregator: AbookAggregator
	/** Mock abook entry aggregator for testing */
	readonly abookEntryAggregator: AbookEntryAggregator
}

export const createTestStore = async (
	type: StoreType,
	{
		abookAggregator,
		abookEntryAggregator,
	}: {
		abookAggregator: AbookAggregator
		abookEntryAggregator: AbookEntryAggregator
	},
): Promise<TestAbookStore> => {
	const mockAbookAggregator = abookAggregator
	const mockAbookEntryAggregator = abookEntryAggregator

	switch (type) {
		case StoreType.IN_MEMORY:
			return {
				store: new InMemoryAbookStore({
					abookAggregator: mockAbookAggregator,
					abookEntryAggregator: mockAbookEntryAggregator,
				}),
				release: async () => {
					// Does nothing, since it's in-memory store.
				},
				abookAggregator: mockAbookAggregator,
				abookEntryAggregator: mockAbookEntryAggregator,
			}
		case StoreType.FS: {
			const fs = new InMemoryFs()
			const rootDir = await fs.getRootDir()
			const store = new FsAbookStore({
				root: rootDir,
				abookSerializer: SerializerUtil.compose(
					FsAbookStoreAbookDataSerializer,
					SerializerUtil.compose(
						SerializerUtil.encoderToSerializer(new JsonEncoder()),
						SerializerUtil.encoderToSerializer(
							new TextBufferEncoder(),
						),
					),
				),
				abookEntrySerializer: SerializerUtil.compose(
					FsAbookStoreAbookEntryDataSerializer,
					SerializerUtil.compose(
						SerializerUtil.encoderToSerializer(new JsonEncoder()),
						SerializerUtil.encoderToSerializer(
							new TextBufferEncoder(),
						),
					),
				),
				abookAggregator: mockAbookAggregator,
				abookEntryAggregator: mockAbookEntryAggregator,
			})
			return {
				store,
				release: async () => {
					// In memory fs needs no cleanup
				},
				abookAggregator: mockAbookAggregator,
				abookEntryAggregator: mockAbookEntryAggregator,
			}
		}
		default:
			return TypeAssert.unreachable(type)
	}
}
