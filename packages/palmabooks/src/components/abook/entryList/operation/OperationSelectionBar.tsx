import { useTransResolver } from "@/app/app.hooks"
import { IconDotsVertical, IconTrash } from "@tabler/icons-react"
import { Button, Card, Group, Menu, Stack, Text } from "@teawithsand/mlui"
import { useState } from "react"
import { AbookEntryAction, AbookEntryDisplayItem } from "../common"
import styles from "./OperationSelectionBar.module.scss"

const calculateTotalSize = (
	items: readonly AbookEntryDisplayItem[],
): number => {
	return items.reduce((total, item) => {
		return total + (item.fileSize || 0)
	}, 0)
}

const formatSize = (bytes: number): string => {
	if (bytes === 0) return "0 B"
	const k = 1024
	const sizes = ["B", "KB", "MB", "GB", "TB"]
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

interface OperationSelectionBarProps {
	readonly selectedItems: readonly AbookEntryDisplayItem[]
	readonly onClearSelection: () => void
	readonly onSelectAll: () => void
	readonly onInvertSelection: () => void
	readonly actions?: readonly AbookEntryAction[]
}

/**
 * Bar that appears when items are selected, showing selection count and available actions.
 */
export const OperationSelectionBar = ({
	selectedItems,
	onClearSelection,
	onSelectAll,
	onInvertSelection,
	actions = [],
}: OperationSelectionBarProps) => {
	const { resolve } = useTransResolver()
	const [isExecutingAction, setIsExecutingAction] = useState(false)

	const handleActionRun = async (action: AbookEntryAction) => {
		setIsExecutingAction(true)
		try {
			await action.onRun(selectedItems)
			onClearSelection() // Clear selection after successful action
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error("Action failed:", error)
			// TODO: Show error notification
		} finally {
			setIsExecutingAction(false)
		}
	}

	const defaultActions: AbookEntryAction[] = [
		{
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			name: (_t) => "Remove Selected",
			onRun: async (items) => {
				// TODO: Implement default remove action
				// eslint-disable-next-line no-console
				console.log(
					"Would remove items:",
					items.map((item) => item.id),
				)
			},
		},
	]

	const allActions = [...defaultActions, ...actions]
	const selectedCount = selectedItems.length
	const totalSize = calculateTotalSize(selectedItems)
	const selectionText =
		selectedCount === 0
			? "No entries selected"
			: selectedCount === 1
				? "1 entry selected"
				: `${selectedCount} entries selected`

	return (
		<Card withBorder padding="md" className={styles.selectionBar}>
			<Group justify="space-between" align="center">
				<Stack gap="xs">
					<Text className={styles.statusText}>{selectionText}</Text>
					{totalSize > 0 && (
						<Text size="sm" color="dimmed">
							Total size: {formatSize(totalSize)}
						</Text>
					)}
				</Stack>

				<Group className={styles.buttonGroup}>
					<Button
						variant="subtle"
						color="blue"
						size="sm"
						onClick={onSelectAll}
						disabled={isExecutingAction}
					>
						Select All
					</Button>

					<Button
						variant="subtle"
						color="blue"
						size="sm"
						onClick={onInvertSelection}
						disabled={isExecutingAction}
					>
						Invert Selection
					</Button>

					<Button
						variant="subtle"
						color="gray"
						size="sm"
						onClick={onClearSelection}
						disabled={isExecutingAction || selectedCount === 0}
					>
						Clear Selection
					</Button>

					{allActions.length > 0 && selectedCount > 0 && (
						<Menu shadow="md" width={200}>
							<Menu.Target>
								<Button
									variant="filled"
									color="blue"
									size="sm"
									rightSection={
										<IconDotsVertical size={14} />
									}
									disabled={isExecutingAction}
									loading={isExecutingAction}
								>
									Actions
								</Button>
							</Menu.Target>
							<Menu.Dropdown>
								{allActions.map((action, index) => (
									<Menu.Item
										key={index}
										leftSection={
											index === 0 ? (
												<IconTrash size={14} />
											) : undefined
										}
										onClick={() => handleActionRun(action)}
										color={index === 0 ? "red" : undefined}
									>
										{resolve(action.name)}
									</Menu.Item>
								))}
							</Menu.Dropdown>
						</Menu>
					)}
				</Group>
			</Group>
		</Card>
	)
}
