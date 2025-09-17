import { useTransResolver } from "@/app/app.hooks"
import { AbookEntryDisposition } from "@teawithsand/booklibr"
import {
	Button,
	Group,
	Modal,
	Select,
	Stack,
	Text,
	TextInput,
} from "@teawithsand/mlui"
import { AbookEntryFilterState } from "../common"
import { createDispositionOptions } from "../common/dispositionHelpers"

interface AdvancedFilterModalProps {
	readonly opened: boolean
	readonly onClose: () => void
	readonly filterState: AbookEntryFilterState
	readonly onFilterChange: (filterState: AbookEntryFilterState) => void
}

export const AdvancedFilterModal = ({
	opened,
	onClose,
	filterState,
	onFilterChange,
}: AdvancedFilterModalProps) => {
	const { resolve } = useTransResolver()

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

	const allDispositionOptions = [
		{
			value: "",
			label: resolve((t) => t.entryList.filter.dispositionPlaceholder),
		},
		...createDispositionOptions(resolve),
	]

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={resolve((t) => t.entryList.filter.advancedFilterTitle)}
			size="md"
		>
			<Stack gap="md">
				<Stack gap="sm">
					<Text size="sm" fw={500}>
						{resolve((t) => t.entryList.filter.searchLabel)}
					</Text>
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
					/>
				</Stack>

				<Stack gap="sm">
					<Text size="sm" fw={500}>
						{resolve((t) => t.entryList.filter.dispositionLabel)}
					</Text>
					<Select
						placeholder={resolve(
							(t) => t.entryList.filter.dispositionPlaceholder,
						)}
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

				<Group justify="space-between" mt="md">
					<Button
						variant="subtle"
						color="gray"
						onClick={clearAllFilters}
					>
						{resolve((t) => t.entryList.filter.clearButton)}
					</Button>
					<Button onClick={onClose}>
						{resolve((t) => t.entryList.filter.applyButton)}
					</Button>
				</Group>
			</Stack>
		</Modal>
	)
}
