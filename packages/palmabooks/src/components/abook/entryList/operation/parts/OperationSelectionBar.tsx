import { useTransResolver } from "@/app/app.hooks"
import {
	IconDotsVertical,
	IconSquareCheck,
	IconSquareCheckFilled,
	IconSquareMinus,
	IconTrash,
} from "@tabler/icons-react"
import {
	Button,
	Card,
	Group,
	Menu,
	MluiBreakpoint,
	Stack,
	Text,
	useBreakpoint,
} from "@teawithsand/mlui"
import { useState } from "react"
import { AbookEntryAction, AbookEntryDisplayItem } from "../../common"
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
	const { isAtLeast } = useBreakpoint()
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
			name: (t) => t.entryList.operations.deleteSelected,
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
	const selectionText = resolve((t) =>
		t.entryList.selection.totalSelected(selectedCount),
	)

	const isMdAndAbove = isAtLeast(MluiBreakpoint.MD)

	return (
		<Card withBorder padding="md" className={styles.selectionBar}>
			<Stack gap="md">
				{/* Status and info section */}
				<Group
					justify={isMdAndAbove ? "space-between" : "center"}
					align="center"
				>
					<Stack gap="xs">
						<Text className={styles.statusText}>
							{selectionText}
						</Text>
						<Text size="sm" color="dimmed">
							{resolve((t) =>
								t.entryList.selection.totalSize(
									formatSize(totalSize),
								),
							)}
						</Text>
					</Stack>

					{/* Selection buttons - right side on md+ screens */}
					{isMdAndAbove && (
						<Group gap="xs" wrap="nowrap">
							<Button
								variant="subtle"
								color="blue"
								size="sm"
								onClick={onSelectAll}
								disabled={isExecutingAction}
								title={resolve(
									(t) => t.entryList.operations.selectAll,
								)}
							>
								<IconSquareCheckFilled size={16} />
							</Button>

							<Button
								variant="subtle"
								color="blue"
								size="sm"
								onClick={onInvertSelection}
								disabled={isExecutingAction}
								title={resolve(
									(t) =>
										t.entryList.selection.invertSelection,
								)}
							>
								<IconSquareMinus size={16} />
							</Button>

							<Button
								variant="subtle"
								color="blue"
								size="sm"
								onClick={onClearSelection}
								disabled={
									isExecutingAction || selectedCount === 0
								}
								title={resolve(
									(t) => t.entryList.selection.unselectAll,
								)}
							>
								<IconSquareCheck size={16} />
							</Button>
						</Group>
					)}
				</Group>

				{/* Actions section */}
				<Group
					justify={!isMdAndAbove ? "center" : "flex-end"}
					gap="xs"
					wrap="wrap"
				>
					{/* Selection buttons - below on smaller screens */}
					{!isMdAndAbove && (
						<Group gap="xs" wrap="nowrap">
							<Button
								variant="subtle"
								color="blue"
								size="sm"
								onClick={onSelectAll}
								disabled={isExecutingAction}
								title={resolve(
									(t) => t.entryList.operations.selectAll,
								)}
							>
								<IconSquareCheckFilled size={16} />
							</Button>

							<Button
								variant="subtle"
								color="blue"
								size="sm"
								onClick={onInvertSelection}
								disabled={isExecutingAction}
								title={resolve(
									(t) =>
										t.entryList.selection.invertSelection,
								)}
							>
								<IconSquareMinus size={16} />
							</Button>

							<Button
								variant="subtle"
								color="blue"
								size="sm"
								onClick={onClearSelection}
								disabled={
									isExecutingAction || selectedCount === 0
								}
								title={resolve(
									(t) => t.entryList.selection.unselectAll,
								)}
							>
								<IconSquareCheck size={16} />
							</Button>
						</Group>
					)}

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
			</Stack>
		</Card>
	)
}
