import { useTransResolver } from "@/app/app.hooks"
import { IconDeselect, IconSelectAll, IconTrash } from "@tabler/icons-react"
import { useAtomValue, useSetAtom } from "@teawithsand/fstate"
import {
	ActionIcon,
	Box,
	Group,
	LoadingFallback,
	LoadingFallbackVariant,
	Text,
} from "@teawithsand/mlui"
import { useState } from "react"
import { useAbookEntryListBehavior } from "../AbookEntryListBehavior"
import { AbookEntrySelectionDeleteModal } from "../selectionDeleteModal"
import styles from "./AbookEntrySelectionBar.module.scss"

/**
 * Minimal selection bar for the entry list.
 * Shows current selection count and placeholder actions.
 */
export const AbookEntrySelectionBar = () => {
	const behavior = useAbookEntryListBehavior()
	const selectedEntriesLoadable = useAtomValue(
		behavior.selectedEntriesLoadable,
	)
	const clearSelection = useSetAtom(behavior.clearSelection)
	const selectAllShownEntries = useSetAtom(behavior.selectAllShownEntries)
	const deleteSelectedEntries = useSetAtom(behavior.deleteSelectedEntries)
	const { resolve } = useTransResolver()
	const [deleteModalOpened, setDeleteModalOpened] = useState(false)

	if (selectedEntriesLoadable.state === "loading") {
		return <LoadingFallback variant={LoadingFallbackVariant.Inline} />
	}

	if (selectedEntriesLoadable.state === "hasError") {
		return (
			<Box className={styles.selectionBar}>
				<Text
					size="sm"
					c="dimmed"
					className={styles.selectionBar__status}
				>
					{resolve((t) => t.common.error)}
				</Text>
			</Box>
		)
	}

	const selectedCount = selectedEntriesLoadable.data.length
	const isDisabled = selectedCount === 0
	const statusText = isDisabled
		? resolve((t) => t.abook.entries.selectionBar.noSelection)
		: resolve((t) =>
				t.abook.entries.selectionBar.selectedCount(selectedCount),
			)

	return (
		<Box className={styles.selectionBar}>
			<Group
				className={styles.selectionBar__content}
				justify="space-between"
				wrap="nowrap"
			>
				<Text
					size="sm"
					c={isDisabled ? "dimmed" : undefined}
					className={styles.selectionBar__status}
				>
					{statusText}
				</Text>
				<Group
					gap="xs"
					wrap="nowrap"
					className={styles.selectionBar__actions}
				>
					<ActionIcon
						variant="subtle"
						size="lg"
						aria-label={resolve(
							(t) => t.abook.entries.selectionBar.selectAll,
						)}
						onClick={() => selectAllShownEntries()}
					>
						<IconSelectAll size={16} />
					</ActionIcon>
					<ActionIcon
						variant="subtle"
						size="lg"
						aria-label={resolve(
							(t) => t.abook.entries.selectionBar.clearSelection,
						)}
						onClick={() => clearSelection()}
						disabled={isDisabled}
					>
						<IconDeselect size={16} />
					</ActionIcon>
					<ActionIcon
						variant="light"
						size="lg"
						color="red"
						aria-label={resolve(
							(t) => t.abook.entries.selectionBar.deleteAction,
						)}
						onClick={() => setDeleteModalOpened(true)}
						disabled={isDisabled}
					>
						<IconTrash size={16} />
					</ActionIcon>
				</Group>
			</Group>
			<AbookEntrySelectionDeleteModal
				opened={deleteModalOpened}
				onClose={() => setDeleteModalOpened(false)}
				onConfirm={() => {
					deleteSelectedEntries()
					setDeleteModalOpened(false)
				}}
				selectedCount={selectedCount}
			/>
		</Box>
	)
}
