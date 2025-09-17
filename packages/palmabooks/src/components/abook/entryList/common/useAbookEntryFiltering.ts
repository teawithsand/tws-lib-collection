import { useMemo } from "react"
import { AbookEntryDisplayItem, AbookEntryFilterState } from "./types"

export const useAbookEntryFiltering = (
	displayItems: readonly AbookEntryDisplayItem[],
	filterState: AbookEntryFilterState,
): AbookEntryDisplayItem[] => {
	return useMemo(() => {
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
}
