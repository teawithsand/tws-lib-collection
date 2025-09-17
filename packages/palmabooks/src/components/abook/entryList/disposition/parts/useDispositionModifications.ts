import { AbookEntryDisposition } from "@teawithsand/booklibr"
import { useCallback, useState } from "react"
import {
	AbookEntryModifications,
	useAbookEntryDisplayItems,
} from "../../common"
import { DispositionAbookEntryListProps } from "../types"

export interface UseDispositionModificationsResult {
	readonly displayItems: ReturnType<typeof useAbookEntryDisplayItems>
	readonly modifications: AbookEntryModifications
	readonly modificationCount: number
	readonly handleDispositionChange: (
		entryId: string,
		disposition: AbookEntryDisposition,
	) => void
	readonly discardChanges: () => void
	readonly hasModifications: boolean
}

export const useDispositionModifications = ({
	entries,
}: Pick<
	DispositionAbookEntryListProps,
	"entries"
>): UseDispositionModificationsResult => {
	const [modifications, setModifications] = useState<AbookEntryModifications>(
		{},
	)

	const displayItems = useAbookEntryDisplayItems(entries, modifications)

	const handleDispositionChange = useCallback(
		(entryId: string, disposition: AbookEntryDisposition) => {
			setModifications((prev) => {
				// Find the original disposition for this entry
				const entry = entries.find((e) => String(e.id) === entryId)
				if (!entry) return prev

				const originalDisposition = entry.data.data.disposition

				// If the new disposition matches the original, remove from modifications
				if (disposition === originalDisposition) {
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const { [entryId]: _, ...rest } = prev
					return rest
				}

				// Otherwise, add/update the modification
				return {
					...prev,
					[entryId]: disposition,
				}
			})
		},
		[entries],
	)

	const discardChanges = useCallback(() => {
		setModifications({})
	}, [])

	const modificationCount = Object.keys(modifications).length
	const hasModifications = modificationCount > 0

	return {
		displayItems,
		modifications,
		modificationCount,
		handleDispositionChange,
		discardChanges,
		hasModifications,
	}
}
