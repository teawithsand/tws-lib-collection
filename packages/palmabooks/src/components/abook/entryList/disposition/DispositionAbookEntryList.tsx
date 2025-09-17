import { Stack } from "@teawithsand/mlui"
import { SimpleAbookEntryFilter, useAbookEntryFilteringState } from "../common"
import {
	DispositionEntryCard,
	DispositionSaveBar,
	useDispositionModifications,
} from "./parts"
import { DispositionAbookEntryListProps } from "./types"

/**
 * Non-autonomous disposition-focused abook entry list component.
 * Displays abook entries with disposition dropdowns allowing disposition changes.
 */
export const DispositionAbookEntryList = ({
	entries,
	onSaveChanges,
	showMetadata = true,
}: DispositionAbookEntryListProps) => {
	const {
		displayItems,
		modifications,
		modificationCount,
		handleDispositionChange,
		discardChanges,
	} = useDispositionModifications({ entries })

	const { filterState, setFilterState, filteredItems } =
		useAbookEntryFilteringState(displayItems)

	return (
		<Stack gap="md">
			<SimpleAbookEntryFilter
				filterState={filterState}
				onFilterChange={setFilterState}
			/>

			<DispositionSaveBar
				modificationCount={modificationCount}
				modifications={modifications}
				onSave={onSaveChanges}
				onDiscard={discardChanges}
			/>

			{filteredItems.length > 0 && (
				<Stack gap="sm">
					{filteredItems.map((item) => (
						<DispositionEntryCard
							key={item.id}
							item={item}
							onDispositionChange={handleDispositionChange}
							showMetadata={showMetadata}
						/>
					))}
				</Stack>
			)}
		</Stack>
	)
}
