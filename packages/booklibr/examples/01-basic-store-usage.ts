/**
 * Basic store usage example
 *
 * This example demonstrates how to:
 * - Create an InMemoryAbookStore
 * - Create an audiobook with metadata
 * - Add entries (audio files) to the audiobook
 * - Read and list audiobooks
 */

import { Timestamp } from "@teawithsand/lngext"
import {
	AbookEntryDisposition,
	AbookEntrySourceType,
	AbookHeaderData,
	InMemoryAbookStore,
} from "../src"

/**
 * Creates a mock metadata extractor for use with InMemoryAbookStore.
 * In a real application, you would use BlobMetadataExtractorImpl.
 */
const createMockExtractor = () => ({
	extractFromUrl: async () => ({
		audio: { type: "not-loaded" as const },
		image: { type: "not-loaded" as const },
	}),
	extractFromBlob: async () => ({
		audio: { type: "not-loaded" as const },
		image: { type: "not-loaded" as const },
	}),
})

const main = async () => {
	// 1. Create the store with a metadata extractor
	const store = new InMemoryAbookStore({
		abookEntryAggregator: {
			aggregate: async () => ({
				metadata: null,
				blobSize: null,
			}),
		},
	})

	// 2. Define audiobook header data
	const headerData: AbookHeaderData = {
		createdAt: Timestamp.fromDate(new Date()),
		metadata: {
			title: "My First Audiobook",
			description: "An example audiobook",
			privateUserNote: "Personal notes here",
		},
		position: null,
	}

	// 3. Create the audiobook
	const abookHandle = await store.createAbook(headerData)
	console.log("Created audiobook with ID:", abookHandle.id)

	// 4. Add an audio entry
	const entryHandle = await abookHandle.createEntry({
		createdAt: Timestamp.fromDate(new Date()),
		name: "Chapter 1",
		disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
		ordinalNumber: 1,
		source: {
			type: AbookEntrySourceType.UPLOAD,
			uploadedAt: Timestamp.fromDate(new Date()),
			uploadFileName: "chapter1.mp3",
			uploadFileMime: "audio/mpeg",
		},
	})
	console.log("Created entry with ID:", entryHandle.id)

	// 5. Read the audiobook
	const abook = await abookHandle.mustRead()
	console.log("Audiobook title:", abook.data.header.metadata.title)
	console.log("Entry count:", abook.aggregate.totalEntries)

	// 6. List all audiobooks
	const allAbooks = await store.listAbooks()
	console.log("Total audiobooks in store:", allAbooks.length)
}

main().catch(console.error)
