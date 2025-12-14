import { useTransResolver } from "@/app/app.hooks"
import { IconAdjustments, IconRefresh, IconSearch } from "@tabler/icons-react"
import { useAtomValue, useSetAtom } from "@teawithsand/fstate"
import { ActionIcon, Group, TextInput } from "@teawithsand/mlui"
import { useAbookEntryListBehavior } from "../AbookEntryListBehavior"
import { AbookEntrySortModal, useAbookEntrySortModal } from "../modal"
import styles from "./AbookEntryListTopBar.module.scss"

/**
 * Top bar component for audiobook entry list with search, sort, and refresh functionality.
 *
 * Uses `AbookEntryListBehavior` context so it accepts no props.
 */
export const AbookEntryListTopBar = () => {
	const behavior = useAbookEntryListBehavior()
	const searchQuery = useAtomValue(behavior.filterText)
	const sortOption = useAtomValue(behavior.sortMode)
	const selectedDispositions = useAtomValue(behavior.selectedDispositions)
	const setFilterText = useSetAtom(behavior.filterText)
	const setSortMode = useSetAtom(behavior.sortMode)
	const setSelectedDispositions = useSetAtom(behavior.selectedDispositions)
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
					onChange={(e) => setFilterText(e.currentTarget.value)}
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
					onClick={behavior.refresh}
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
				onOptionChange={(opt) => setSortMode(opt)}
				selectedDispositions={selectedDispositions}
				onDispositionsChange={(d) => setSelectedDispositions(d)}
			/>
		</>
	)
}
