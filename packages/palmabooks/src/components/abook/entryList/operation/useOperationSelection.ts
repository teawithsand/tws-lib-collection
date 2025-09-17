import { useCallback, useState } from "react"
import { useAbookEntryDisplayItems } from "../common"
import { OperationAbookEntryListProps } from "./types"

export interface UseOperationSelectionResult {
	readonly displayItems: ReturnType<typeof useAbookEntryDisplayItems>
	readonly selectedItems: Set<string>
	readonly handleSelectionChange: (entryId: string, selected: boolean) => void
	readonly selectAll: () => void
	readonly invertSelection: () => void
	readonly clearSelection: () => void
	readonly hasSelection: boolean
	readonly selectedItemsArray: ReturnType<typeof useAbookEntryDisplayItems>
}

export const useOperationSelection = ({
	entries,
}: Pick<
	OperationAbookEntryListProps,
	"entries"
>): UseOperationSelectionResult => {
	const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

	const displayItems = useAbookEntryDisplayItems(entries)

	const handleSelectionChange = useCallback(
		(entryId: string, selected: boolean) => {
			setSelectedItems((prev) => {
				const newSet = new Set(prev)
				if (selected) {
					newSet.add(entryId)
				} else {
					newSet.delete(entryId)
				}
				return newSet
			})
		},
		[],
	)

	const selectAll = useCallback(() => {
		const allIds = new Set(entries.map((entry) => String(entry.id)))
		setSelectedItems(allIds)
	}, [entries])

	const invertSelection = useCallback(() => {
		const allIds = new Set(entries.map((entry) => String(entry.id)))
		setSelectedItems((prev) => {
			const newSet = new Set<string>()
			allIds.forEach((id) => {
				if (!prev.has(id)) {
					newSet.add(id)
				}
			})
			return newSet
		})
	}, [entries])

	const clearSelection = useCallback(() => {
		setSelectedItems(new Set())
	}, [])

	const hasSelection = selectedItems.size > 0
	const selectedItemsArray = displayItems.filter((item) =>
		selectedItems.has(item.id),
	)

	return {
		displayItems,
		selectedItems,
		handleSelectionChange,
		selectAll,
		invertSelection,
		clearSelection,
		hasSelection,
		selectedItemsArray,
	}
}
