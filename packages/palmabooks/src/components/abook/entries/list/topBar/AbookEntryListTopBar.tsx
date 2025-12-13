import { useTransResolver } from "@/app/app.hooks"
import { IconAdjustments, IconRefresh, IconSearch } from "@tabler/icons-react"
import { AbookEntryDisposition } from "@teawithsand/booklibr"
import { ActionIcon, Group, TextInput } from "@teawithsand/mlui"
import {
	AbookEntrySortModal,
	AbookEntrySortOption,
	useAbookEntrySortModal,
} from "../modal"
import styles from "./AbookEntryListTopBar.module.scss"

export interface AbookEntryListTopBarProps {
	searchQuery: string
	onSearchChange: (query: string) => void
	sortOption: AbookEntrySortOption
	onSortChange: (option: AbookEntrySortOption) => void
	selectedDispositions: Set<AbookEntryDisposition>
	onDispositionsChange: (dispositions: Set<AbookEntryDisposition>) => void
	onRefresh: () => void
}

/**
 * Top bar component for audiobook entry list with search, sort, and refresh functionality.
 */
export const AbookEntryListTopBar = ({
	searchQuery,
	onSearchChange,
	sortOption,
	onSortChange,
	selectedDispositions,
	onDispositionsChange,
	onRefresh,
}: AbookEntryListTopBarProps) => {
	const { resolve } = useTransResolver()
	const sortModal = useAbookEntrySortModal()

	return (
		<>
			<Group gap="sm" className={styles.topBar} wrap="nowrap">
				<TextInput
					placeholder={resolve(
						(t) => t.abook.entries.searchPlaceholder,
					)}
					value={searchQuery}
					onChange={(e) => onSearchChange(e.currentTarget.value)}
					leftSection={<IconSearch size={16} />}
					style={{ flex: 1, minWidth: 0 }}
				/>
				<ActionIcon
					onClick={sortModal.openModal}
					variant="light"
					size="lg"
					aria-label={resolve(
						(t) => t.abook.entries.filterModal.openButton,
					)}
					className={styles.filterButton}
				>
					<IconAdjustments size={18} />
				</ActionIcon>
				<ActionIcon
					onClick={onRefresh}
					variant="light"
					size="lg"
					aria-label={resolve((t) => t.abook.list.refreshButton)}
					className={styles.refreshButton}
				>
					<IconRefresh size={18} />
				</ActionIcon>
			</Group>

			<AbookEntrySortModal
				opened={sortModal.opened}
				onClose={sortModal.closeModal}
				currentOption={sortOption}
				onOptionChange={onSortChange}
				selectedDispositions={selectedDispositions}
				onDispositionsChange={onDispositionsChange}
			/>
		</>
	)
}
