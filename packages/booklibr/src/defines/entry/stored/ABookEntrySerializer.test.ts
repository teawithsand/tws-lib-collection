import { describe, expect, test } from "vitest"
import { ResultType } from "../../../utils/result"
import { ABookEntry, ABookEntryDisposition } from "../entry"
import { ABookEntrySerializer, StoredABookEntryDispositionV1 } from "./index"

const makeEntry = (opts: Partial<ABookEntry> = {}): ABookEntry => {
	const {
		disposition = ABookEntryDisposition.AUDIO,
		metadata = {
			uploadMetadata: {
				fileName: "file.mp3",
				lastModifiedTimestamp: 123,
				fileSize: 456,
				path: "/tmp/file.mp3",
			},
			audioMetadata: {
				duration: { type: ResultType.OK, value: 42 },
			},
		},
		locator = { type: 1, id: "abc" },
	} = opts
	return {
		disposition,
		metadata,
		locator,
	}
}

const makeSerializedError = () => ({
	name: "Error",
	message: "fail",
	stack: "stacktrace",
})

describe("ABookEntrySerializer", () => {
	test("serialize and deserialize roundtrip for AUDIO", () => {
		const entry = makeEntry({ disposition: ABookEntryDisposition.AUDIO })
		const stored = ABookEntrySerializer.serialize(entry)
		expect(stored.disposition).toBe(StoredABookEntryDispositionV1.AUDIO)
		const roundtrip = ABookEntrySerializer.deserialize(stored)
		expect(roundtrip).toEqual(entry)
	})

	test("serialize and deserialize roundtrip for IMAGE", () => {
		const entry = makeEntry({ disposition: ABookEntryDisposition.IMAGE })
		const stored = ABookEntrySerializer.serialize(entry)
		expect(stored.disposition).toBe(StoredABookEntryDispositionV1.IMAGE)
		const roundtrip = ABookEntrySerializer.deserialize(stored)
		expect(roundtrip).toEqual(entry)
	})

	test("serialize and deserialize roundtrip for DESCRIPTION", () => {
		const entry = makeEntry({
			disposition: ABookEntryDisposition.DESCRIPTION,
		})
		const stored = ABookEntrySerializer.serialize(entry)
		expect(stored.disposition).toBe(
			StoredABookEntryDispositionV1.DESCRIPTION,
		)
		const roundtrip = ABookEntrySerializer.deserialize(stored)
		expect(roundtrip).toEqual(entry)
	})

	test("serialize handles null metadata fields", () => {
		const entry = makeEntry({
			metadata: {
				uploadMetadata: null,
				audioMetadata: null,
			},
		})
		const stored = ABookEntrySerializer.serialize(entry)
		expect(stored.metadata.uploadMetadata).toBeNull()
		expect(stored.metadata.audioMetadata).toBeNull()
		const roundtrip = ABookEntrySerializer.deserialize(stored)
		expect(roundtrip).toEqual(entry)
	})

	test("serialize handles missing metadata", () => {
		const entry = makeEntry({
			metadata: { uploadMetadata: null, audioMetadata: null },
		})
		const stored = ABookEntrySerializer.serialize(entry)
		expect(stored.metadata.uploadMetadata).toBeNull()
		expect(stored.metadata.audioMetadata).toBeNull()
		const roundtrip = ABookEntrySerializer.deserialize(stored)
		expect(roundtrip).toEqual({
			...entry,
			metadata: { uploadMetadata: null, audioMetadata: null },
		})
	})

	test("serialize handles locator type 2", () => {
		const entry = makeEntry({
			locator: { type: 2, url: "http://example.com" },
		})
		const stored = ABookEntrySerializer.serialize(entry)
		expect(stored.locator).toEqual({ type: 2, url: "http://example.com" })
		const roundtrip = ABookEntrySerializer.deserialize(stored)
		expect(roundtrip).toEqual(entry)
	})

	test("serialize handles audioMetadata duration error", () => {
		const entry = makeEntry({
			metadata: {
				uploadMetadata: null,
				audioMetadata: {
					duration: {
						type: ResultType.ERROR,
						error: makeSerializedError(),
					},
				},
			},
		})
		const stored = ABookEntrySerializer.serialize(entry)
		expect(stored.metadata.audioMetadata?.duration.type).toBe("err")
		expect(stored.metadata.audioMetadata?.duration.value).toEqual(
			makeSerializedError(),
		)
		const roundtrip = ABookEntrySerializer.deserialize(stored)
		expect(roundtrip).toEqual(entry)
	})

	test("deserialize produces stable snapshots for all dispositions", () => {
		// Inline serialized versions for each disposition with correct types
		const audioSerialized = {
			disposition: StoredABookEntryDispositionV1.AUDIO,
			metadata: {
				uploadMetadata: {
					fileName: "file.mp3",
					lastModifiedTimestamp: 123,
					fileSize: 456,
					path: "/tmp/file.mp3",
				},
				audioMetadata: {
					duration: { type: "ok" as const, value: 42 },
				},
			},
			locator: { type: 1 as const, id: "abc" },
		}
		const imageSerialized = {
			disposition: StoredABookEntryDispositionV1.IMAGE,
			metadata: {
				uploadMetadata: {
					fileName: "file.mp3",
					lastModifiedTimestamp: 123,
					fileSize: 456,
					path: "/tmp/file.mp3",
				},
				audioMetadata: {
					duration: { type: "ok" as const, value: 42 },
				},
			},
			locator: { type: 1 as const, id: "abc" },
		}
		const descriptionSerialized = {
			disposition: StoredABookEntryDispositionV1.DESCRIPTION,
			metadata: {
				uploadMetadata: {
					fileName: "file.mp3",
					lastModifiedTimestamp: 123,
					fileSize: 456,
					path: "/tmp/file.mp3",
				},
				audioMetadata: {
					duration: { type: "ok" as const, value: 42 },
				},
			},
			locator: { type: 1 as const, id: "abc" },
		}

		expect(
			ABookEntrySerializer.deserialize(audioSerialized),
		).toMatchSnapshot()
		expect(
			ABookEntrySerializer.deserialize(imageSerialized),
		).toMatchSnapshot()
		expect(
			ABookEntrySerializer.deserialize(descriptionSerialized),
		).toMatchSnapshot()
	})
})
