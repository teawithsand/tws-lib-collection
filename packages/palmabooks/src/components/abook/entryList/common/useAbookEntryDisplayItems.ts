import { AbookEntry, WithId } from "@teawithsand/booklibr"
import { useMemo } from "react"
import { AbookEntryDisplayItem, AbookEntryModifications } from "./types"

export const useAbookEntryDisplayItems = (
	entries: readonly WithId<AbookEntry>[],
	modifications: AbookEntryModifications = {},
): AbookEntryDisplayItem[] => {
	return useMemo((): AbookEntryDisplayItem[] => {
		return entries.map((entry) => {
			const source = entry.data.data.source
			let fileName = "Unknown file"
			let fileSize: number | undefined
			let lastModified: number | undefined
			let mimeType: string | undefined

			if (source.type === "upload") {
				fileName = source.uploadFileName
				fileSize = entry.data.aggregate.blobSize || undefined
				lastModified = source.uploadedAt
				mimeType = source.uploadFileMime
			}

			const entryId = String(entry.id)
			const originalDisposition = entry.data.data.disposition
			const currentDisposition =
				modifications[entryId] ?? originalDisposition
			const isModified =
				modifications[entryId] !== undefined &&
				modifications[entryId] !== originalDisposition

			return {
				id: entryId,
				entry,
				name: fileName,
				disposition: currentDisposition,
				originalDisposition,
				isModified,
				fileSize,
				lastModified,
				type: mimeType,
				hasSuccessfulMetadata: entry.data.aggregate.metadata !== null,
			}
		})
	}, [entries, modifications])
}
