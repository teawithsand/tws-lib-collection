import { useTransResolver } from "@/app/app.hooks"
import { AbookEntryDisposition } from "@teawithsand/booklibr"
import { Card, Group, Select, Stack, Text, TextInput } from "@teawithsand/mlui"
import { createDispositionOptions } from "./dispositionHelpers"
import { AbookEntryFilterState } from "./types"

interface AbookEntryFilterProps {
	readonly filterState: AbookEntryFilterState
	readonly onFilterChange: (filterState: AbookEntryFilterState) => void
	readonly totalCount: number
	readonly filteredCount: number
}

export const AbookEntryFilter = ({
	filterState,
	onFilterChange,
	totalCount,
	filteredCount,
}: AbookEntryFilterProps) => {
	const { resolve } = useTransResolver()

	const updateFilter = (updates: Partial<AbookEntryFilterState>) => {
		onFilterChange({
			...filterState,
			...updates,
		})
	}

	const allDispositionOptions = [
		{ value: "", label: "All Dispositions" },
		...createDispositionOptions(resolve),
	]

	return (
		<Card withBorder padding="md">
			<Stack gap="md">
				<Stack gap="sm">
					<TextInput
						placeholder="Search by name..."
						value={filterState.searchText}
						onChange={(event) =>
							updateFilter({
								searchText: event.currentTarget.value,
							})
						}
					/>
					<Select
						placeholder="Filter by disposition"
						value={filterState.dispositionFilter || ""}
						data={allDispositionOptions}
						onChange={(value) => {
							const disposition = value || undefined
							updateFilter({
								dispositionFilter: disposition as
									| AbookEntryDisposition
									| undefined,
							})
						}}
						clearable
					/>
				</Stack>
				<Group justify="end">
					<Text size="sm" color="dimmed">
						Showing {filteredCount} of {totalCount} entries
					</Text>
				</Group>
			</Stack>
		</Card>
	)
}
