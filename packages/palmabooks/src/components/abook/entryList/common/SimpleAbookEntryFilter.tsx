import { useTransResolver } from "@/app/app.hooks"
import { IconAdjustments, IconX } from "@tabler/icons-react"
import { ActionIcon, Card, Group, Stack, TextInput } from "@teawithsand/mlui"
import { AdvancedFilterModal, useAdvancedFilterModal } from "../filterModal"
import { AbookEntryFilterState } from "./types"

interface SimpleAbookEntryFilterProps {
	readonly filterState: AbookEntryFilterState
	readonly onFilterChange: (filterState: AbookEntryFilterState) => void
}

export const SimpleAbookEntryFilter = ({
	filterState,
	onFilterChange,
}: SimpleAbookEntryFilterProps) => {
	const { resolve } = useTransResolver()
	const { opened, openModal, closeModal } = useAdvancedFilterModal()

	const updateFilter = (updates: Partial<AbookEntryFilterState>) => {
		onFilterChange({
			...filterState,
			...updates,
		})
	}

	const clearAllFilters = () => {
		onFilterChange({
			searchText: "",
			dispositionFilter: undefined,
		})
	}

	const hasActiveFilters =
		filterState.searchText || filterState.dispositionFilter

	return (
		<>
			<Card withBorder padding="md">
				<Stack gap="md">
					<Group gap="xs">
						<TextInput
							placeholder={resolve(
								(t) => t.entryList.filter.searchPlaceholder,
							)}
							value={filterState.searchText}
							onChange={(event) =>
								updateFilter({
									searchText: event.currentTarget.value,
								})
							}
							style={{ flex: 1 }}
						/>
						<ActionIcon
							variant="subtle"
							color="blue"
							size="lg"
							onClick={openModal}
							aria-label={resolve(
								(t) => t.entryList.filter.advancedFilter,
							)}
						>
							<IconAdjustments size={18} />
						</ActionIcon>
						{hasActiveFilters && (
							<ActionIcon
								variant="subtle"
								color="gray"
								size="lg"
								onClick={clearAllFilters}
								aria-label={resolve(
									(t) => t.entryList.filter.clearFilter,
								)}
							>
								<IconX size={18} />
							</ActionIcon>
						)}
					</Group>
				</Stack>
			</Card>

			<AdvancedFilterModal
				opened={opened}
				onClose={closeModal}
				filterState={filterState}
				onFilterChange={onFilterChange}
			/>
		</>
	)
}
