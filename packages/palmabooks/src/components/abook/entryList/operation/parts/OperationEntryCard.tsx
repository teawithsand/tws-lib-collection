import { useTransResolver } from "@/app/app.hooks"
import { IconInfoCircle } from "@tabler/icons-react"
import {
	ActionIcon,
	Badge,
	Card,
	Checkbox,
	Group,
	MluiBreakpoint,
	Modal,
	Stack,
	Text,
	useBreakpoint,
} from "@teawithsand/mlui"
import { useState } from "react"
import {
	AbookEntryDisplayItem,
	AbookEntryMetadataDisplay,
	getDispositionColor,
	getDispositionLabel,
} from "../../common"
import styles from "../../common/AbookEntryCard.module.scss"

interface OperationEntryCardProps {
	readonly item: AbookEntryDisplayItem
	readonly showMetadata?: boolean
	readonly selected?: boolean
	readonly onSelectionChange?: (entryId: string, selected: boolean) => void
}

/**
 * Entry card focused on bulk operations.
 * Shows a checkbox for selection and displays the disposition as a read-only badge.
 */
export const OperationEntryCard = ({
	item,
	showMetadata = true,
	selected = false,
	onSelectionChange,
}: OperationEntryCardProps) => {
	const { resolve } = useTransResolver()
	const { is } = useBreakpoint()
	const [isModalOpen, setIsModalOpen] = useState(false)
	const isXs = is(MluiBreakpoint.XS)

	const handleSelectionChange = (checked: boolean) => {
		onSelectionChange?.(item.id, checked)
	}

	// Mobile layout for XS screens
	if (isXs) {
		return (
			<Card withBorder className={styles.card}>
				<Group align="flex-start" gap="md">
					<Checkbox
						checked={selected}
						onChange={(event) =>
							handleSelectionChange(event.currentTarget.checked)
						}
						className={styles.checkbox}
						aria-label={`Select ${item.name}`}
						style={{ marginTop: "2px" }}
					/>

					<Stack
						gap="xs"
						style={{ flex: 1, minWidth: 0, overflow: "hidden" }}
					>
						{/* File title */}
						<Text
							size="sm"
							fw={500}
							className={styles.fileName}
							lineClamp={2}
							style={{ width: "100%" }}
						>
							{item.name}
						</Text>

						{/* Badge and info button row */}
						<Group justify="space-between" align="center">
							<Badge
								color={getDispositionColor(item.disposition)}
								variant="filled"
								size="sm"
								radius="md"
								style={{
									textTransform: "uppercase",
									fontSize: "10px",
									fontWeight: 600,
								}}
							>
								{getDispositionLabel(item.disposition, resolve)}
							</Badge>

							{showMetadata && item.hasSuccessfulMetadata && (
								<ActionIcon
									variant="light"
									size="sm"
									onClick={() => setIsModalOpen(true)}
									aria-label="Show metadata"
									color="blue"
								>
									<IconInfoCircle size={14} />
								</ActionIcon>
							)}
						</Group>
					</Stack>
				</Group>

				{showMetadata && item.hasSuccessfulMetadata && (
					<Modal
						opened={isModalOpen}
						onClose={() => setIsModalOpen(false)}
						title={item.name}
						size="sm"
					>
						<AbookEntryMetadataDisplay item={item} />
					</Modal>
				)}
			</Card>
		)
	}

	// Desktop layout for larger screens
	return (
		<Card withBorder className={styles.card}>
			<Group align="flex-start" gap="md">
				<Checkbox
					checked={selected}
					onChange={(event) =>
						handleSelectionChange(event.currentTarget.checked)
					}
					className={styles.checkbox}
					aria-label={`Select ${item.name}`}
				/>

				<Stack gap="md" className={styles.content}>
					<Group justify="space-between" style={{ width: "100%" }}>
						<Text
							className={styles.fileName}
							lineClamp={2}
							style={{ flex: 1, minWidth: 0 }}
						>
							{item.name}
						</Text>
						<Badge
							color={getDispositionColor(item.disposition)}
							variant="light"
							size="sm"
							style={{
								flexShrink: 0,
								marginLeft: "var(--mantine-spacing-sm)",
							}}
						>
							{getDispositionLabel(item.disposition, resolve)}
						</Badge>
					</Group>

					{showMetadata && item.hasSuccessfulMetadata && (
						<AbookEntryMetadataDisplay item={item} />
					)}
				</Stack>
			</Group>
		</Card>
	)
}
