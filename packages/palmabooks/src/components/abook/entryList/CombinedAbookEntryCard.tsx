import { useTransResolver } from "@/app/app.hooks"
import { AbookEntryDisposition } from "@teawithsand/booklibr"
import {
	Badge,
	Card,
	Checkbox,
	Group,
	Select,
	Stack,
	Text,
} from "@teawithsand/mlui"
import {
	AbookEntryDisplayItem,
	AbookEntryMetadataDisplay,
	createDispositionOptions,
} from "./common"
import styles from "./common/AbookEntryCard.module.scss"

interface CombinedAbookEntryCardProps {
	readonly item: AbookEntryDisplayItem
	readonly onDispositionChange?: (
		entryId: string,
		disposition: AbookEntryDisposition,
	) => void
	readonly showMetadata?: boolean
	readonly selected?: boolean
	readonly onSelectionChange?: (entryId: string, selected: boolean) => void
}

/**
 * Combined abook entry card that supports both disposition changes and selection.
 * This is used by the legacy AbookEntryList component for backward compatibility.
 */
export const CombinedAbookEntryCard = ({
	item,
	onDispositionChange,
	showMetadata = true,
	selected = false,
	onSelectionChange,
}: CombinedAbookEntryCardProps) => {
	const { resolve } = useTransResolver()
	const handleSelectionChange = (checked: boolean) => {
		if (onSelectionChange) {
			onSelectionChange(item.id, checked)
		}
	}

	return (
		<Card
			withBorder
			className={`${styles.card} ${item.isModified ? styles.modified : ""}`}
		>
			<Group align="flex-start" gap="md">
				<Checkbox
					checked={selected}
					onChange={(event) =>
						handleSelectionChange(event.currentTarget.checked)
					}
					className={styles.checkbox}
				/>
				<Stack gap="md" className={styles.content}>
					<Group justify="space-between">
						<Text className={styles.fileName}>{item.name}</Text>
						{item.isModified && (
							<Badge color="blue" variant="light" size="sm">
								{"Modified"}
							</Badge>
						)}
					</Group>
					<Select
						value={item.disposition}
						data={createDispositionOptions(resolve)}
						onChange={(disposition) => {
							if (disposition && onDispositionChange) {
								onDispositionChange(
									item.id,
									disposition as AbookEntryDisposition,
								)
							}
						}}
					/>
					{showMetadata && item.hasSuccessfulMetadata && (
						<AbookEntryMetadataDisplay item={item} />
					)}
				</Stack>
			</Group>
		</Card>
	)
}
