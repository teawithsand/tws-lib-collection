import {
	AbookEntryDisposition,
	AbookEntrySourceType,
	InMemoryAbookStore,
	type AbookAggregator,
	type AbookEntryAggregator,
	type AbookHandle,
	type AbookHeaderData,
} from "@teawithsand/booklibr"
import { createStore } from "@teawithsand/fstate"
import { Timestamp } from "@teawithsand/lngext"
import { describe, expect, test, vi } from "vitest"
import type { AbookAddFilesWizardEntry } from "./AbookAddFilesWizardBehavior"
import type { AbookAddFilesWizardUploadProgress } from "./upload"
import { AbookAddFilesWizardUpload } from "./upload"

const createTestHandle = async (): Promise<AbookHandle> => {
	const abookAggregator: AbookAggregator = {
		aggregate: async (data) => ({
			totalEntries: data.entries.size,
			totalDurationMillis: 0,
		}),
	}
	const entryAggregator: AbookEntryAggregator = {
		aggregate: async (_data, blob) => ({
			metadata: null,
			blobSize: blob.size,
		}),
	}
	const store = new InMemoryAbookStore({
		abookAggregator,
		abookEntryAggregator: entryAggregator,
	})
	const header: AbookHeaderData = {
		createdAt: Timestamp.fromMillis(0),
		metadata: {
			title: "Test title",
			description: "Test description",
			privateUserNote: "Test note",
		},
		position: null,
	}
	return store.createAbook(header)
}

const buildEntry = (
	fileName: string,
	content: string,
	originalName: string,
	mime = "audio/mpeg",
): AbookAddFilesWizardEntry => ({
	file: new Blob([content], { type: mime }),
	fileName,
	originalFileName: originalName,
	isEnabled: true,
})

describe("AbookAddFilesWizardUpload", () => {
	test("uploads all files and updates progress", async () => {
		const handle = await createTestHandle()
		const upload = new AbookAddFilesWizardUpload()
		const store = createStore()
		const definitions = [
			{
				fileName: "track-01.mp3",
				content: "first",
				originalName: "original-track-01.mp3",
			},
			{
				fileName: "track-02.mp3",
				content: "second",
				originalName: "original-track-02.mp3",
			},
		]
		const entries: AbookAddFilesWizardEntry[] = definitions.map(
			(definition) =>
				buildEntry(
					definition.fileName,
					definition.content,
					definition.originalName,
				),
		)
		const entriesByName = new Map(
			entries.map((entry) => [entry.fileName, entry] as const),
		)

		const progressRecords: Array<AbookAddFilesWizardUploadProgress | null> =
			[]
		progressRecords.push(store.get(upload.uploadingProgress))
		const unsubscribe = store.sub(upload.uploadingProgress, () => {
			progressRecords.push(store.get(upload.uploadingProgress))
		})

		const promise = store.set(upload.startUpload, handle, entries)
		try {
			expect(store.get(upload.uploadingPromise)).toBe(promise)
			await promise
		} finally {
			unsubscribe()
		}

		const finalProgress = store.get(upload.uploadingProgress)
		progressRecords.push(finalProgress)

		expect(finalProgress).toEqual({
			totalFiles: entries.length,
			processedFiles: entries.length,
			currentFile: null,
			error: null,
		})

		const seenCurrentFiles = progressRecords
			.map((progress) => progress?.currentFile)
			.filter((value): value is AbookAddFilesWizardEntry => !!value)
		expect(seenCurrentFiles).toContain(entries[0])
		expect(seenCurrentFiles).toContain(entries[1])

		const entryHandles = await handle.listEntries()
		expect(entryHandles).toHaveLength(entries.length)

		for (const entryHandle of entryHandles) {
			const entry = await entryHandle.mustRead()
			const blob = await entryHandle.mustReadBlob()

			const original = entriesByName.get(entry.data.name)
			expect(original).toBeDefined()
			if (!original) {
				throw new Error("Original entry not found for stored entry")
			}

			expect(entry.data.disposition).toBe(AbookEntryDisposition.UNKNOWN)
			expect(entry.data.source.type).toBe(AbookEntrySourceType.UPLOAD)
			if (entry.data.source.type !== AbookEntrySourceType.UPLOAD) {
				throw new Error("Stored entry should come from upload source")
			}
			expect(entry.data.source.uploadFileName).toBe(
				original.originalFileName,
			)
			expect(entry.data.source.uploadFileMime).toBe(original.file.type)
			expect(blob.size).toBe(original.file.size)
			expect(blob).toBe(original.file)
		}
	})

	test("stores error details when upload fails", async () => {
		const handle = await createTestHandle()
		const upload = new AbookAddFilesWizardUpload()
		const store = createStore()
		const entries = [
			buildEntry("broken.mp3", "broken", "broken-original.mp3"),
		]
		const expectedError = new Error("createEntry failed")
		const spy = vi
			.spyOn(handle, "createEntry")
			.mockRejectedValue(expectedError)

		const promise = store.set(upload.startUpload, handle, entries)
		await expect(promise).rejects.toBe(expectedError)
		expect(store.get(upload.uploadingPromise)).toBe(promise)

		const finalProgress = store.get(upload.uploadingProgress)
		expect(finalProgress).toEqual({
			totalFiles: entries.length,
			processedFiles: 0,
			currentFile: null,
			error: expectedError,
		})

		spy.mockRestore()
	})
})
