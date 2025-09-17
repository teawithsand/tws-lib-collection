import { Stack } from "@teawithsand/mlui"
import { SimpleAbookEntryFilter, useAbookEntryFilteringState } from "../common"
import {
	OperationEntryCard,
	OperationSelectionBar,
	useOperationSelection,
} from "./parts"
import { OperationAbookEntryListProps } from "./types"

/**
 * Non-autonomous operation-focused abook entry list component.
 * Displays abook entries with checkboxes and supports bulk operations.
 */
export const OperationAbookEntryList = ({
	entries,
	actions = [],
	showMetadata = true,
}: OperationAbookEntryListProps) => {
	const {
		displayItems,
		selectedItems,
		handleSelectionChange,
		selectAll,
		invertSelection,
		clearSelection,
		selectedItemsArray,
	} = useOperationSelection({ entries })

	const { filterState, setFilterState, filteredItems } =
		useAbookEntryFilteringState(displayItems)

	return (
		<Stack gap="md">
			<SimpleAbookEntryFilter
				filterState={filterState}
				onFilterChange={setFilterState}
			/>

			<OperationSelectionBar
				selectedItems={selectedItemsArray}
				onClearSelection={clearSelection}
				onSelectAll={selectAll}
				onInvertSelection={invertSelection}
				actions={actions}
			/>

			{filteredItems.length > 0 && (
				<Stack gap="sm">
					{filteredItems.map((item) => (
						<OperationEntryCard
							key={item.id}
							item={item}
							showMetadata={showMetadata}
							selected={selectedItems.has(item.id)}
							onSelectionChange={handleSelectionChange}
						/>
					))}
				</Stack>
			)}
		</Stack>
	)
}
