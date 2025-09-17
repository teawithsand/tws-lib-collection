import { useCallback, useMemo, useState } from "react"
import { AbookEntryDisplayItem, AbookEntryFilterState } from "./types"

export interface UseAbookEntryFilteringResult {
	readonly filterState: AbookEntryFilterState
	readonly setFilterState: (filterState: AbookEntryFilterState) => void
	readonly filteredItems: readonly AbookEntryDisplayItem[]
	readonly totalCount: number
	readonly filteredCount: number
}

export const useAbookEntryFilteringState = (
	displayItems: readonly AbookEntryDisplayItem[],
): UseAbookEntryFilteringResult => {
	const [filterState, setFilterState] = useState<AbookEntryFilterState>({
		searchText: "",
	})

	const filteredItems = useMemo(() => {
		return displayItems.filter((item) => {
			// Filter by search text
			if (
				filterState.searchText &&
				!item.name
					.toLowerCase()
					.includes(filterState.searchText.toLowerCase())
			) {
				return false
			}

			// Filter by disposition
			if (
				filterState.dispositionFilter &&
				item.disposition !== filterState.dispositionFilter
			) {
				return false
			}

			return true
		})
	}, [displayItems, filterState])

	const updateFilterState = useCallback(
		(newFilterState: AbookEntryFilterState) => {
			setFilterState(newFilterState)
		},
		[],
	)

	return {
		filterState,
		setFilterState: updateFilterState,
		filteredItems,
		totalCount: displayItems.length,
		filteredCount: filteredItems.length,
	}
}
