import { useTransResolver } from "@/app/app.hooks"
import { AbookEntryDisposition } from "@teawithsand/booklibr"
import {
	Badge,
	Card,
	Group,
	MluiBreakpoint,
	Select,
	Stack,
	Text,
	useBreakpoint,
} from "@teawithsand/mlui"
import {
	AbookEntryDisplayItem,
	AbookEntryMetadataDisplay,
	createDispositionOptions,
} from "../../common"
import styles from "../../common/AbookEntryCard.module.scss"
import dispositionStyles from "./DispositionEntryCard.module.scss"

interface DispositionEntryCardProps {
	readonly item: AbookEntryDisplayItem
	readonly onDispositionChange?: (
		entryId: string,
		disposition: AbookEntryDisposition,
	) => void
	readonly showMetadata?: boolean
}

const getDispositionClassName = (
	disposition: AbookEntryDisposition,
): string => {
	switch (disposition) {
		case AbookEntryDisposition.PLAYABLE_AUDIO:
			return dispositionStyles.playableAudio
		case AbookEntryDisposition.COVER_IMAGE:
			return dispositionStyles.coverImage
		default:
			return ""
	}
}

/**
 * Entry card focused on disposition management.
 * Shows a dropdown for changing the file disposition.
 */
export const DispositionEntryCard = ({
	item,
	onDispositionChange,
	showMetadata = true,
}: DispositionEntryCardProps) => {
	const { resolve } = useTransResolver()
	const { isAtMost } = useBreakpoint()
	const isSmallDevice = isAtMost(MluiBreakpoint.SM)

	const handleDispositionChange = (disposition: string | null) => {
		if (disposition && onDispositionChange) {
			onDispositionChange(item.id, disposition as AbookEntryDisposition)
		}
	}

	// Mobile layout for small devices
	if (isSmallDevice) {
		return (
			<Card
				withBorder
				padding="md"
				className={`${styles.card} ${item.isModified ? styles.modified : ""}`}
			>
				<Stack gap="sm">
					{/* File title */}
					<Text
						fw={500}
						size="sm"
						className={styles.fileName}
						lineClamp={2}
						style={{ width: "100%" }}
					>
						{item.name}
					</Text>

					{/* Full-width disposition selector */}
					<Select
						value={item.disposition}
						data={createDispositionOptions(resolve)}
						onChange={handleDispositionChange}
						clearable={false}
						size="sm"
						variant={item.isModified ? "filled" : "default"}
						className={dispositionStyles.select}
						classNames={{
							input: `${dispositionStyles.selectInput} ${getDispositionClassName(item.disposition)} ${item.isModified ? dispositionStyles.modified : ""}`,
						}}
						style={{ width: "100%" }}
					/>

					{/* Metadata section */}
					{showMetadata && item.hasSuccessfulMetadata && (
						<div className={dispositionStyles.metadata}>
							<AbookEntryMetadataDisplay item={item} />
						</div>
					)}
				</Stack>
			</Card>
		)
	}

	// Desktop layout for larger screens
	return (
		<Card
			withBorder
			padding="md"
			className={`${styles.card} ${item.isModified ? styles.modified : ""}`}
		>
			<Stack gap="sm">
				{/* Header with filename and disposition selector */}
				<Group
					justify="space-between"
					align="flex-start"
					wrap="nowrap"
					style={{ width: "100%" }}
				>
					<div
						className={dispositionStyles.content}
						style={{ minWidth: 0, flex: 1 }}
					>
						<Text
							fw={500}
							size="sm"
							className={styles.fileName}
							lineClamp={2}
						>
							{item.name}
						</Text>
					</div>

					<Select
						value={item.disposition}
						data={createDispositionOptions(resolve)}
						onChange={handleDispositionChange}
						clearable={false}
						size="xs"
						variant="filled"
						className={dispositionStyles.select}
						classNames={{
							input: `${dispositionStyles.selectInput} ${getDispositionClassName(item.disposition)}`,
						}}
					/>
				</Group>

				{/* Modification indicator */}
				{item.isModified && (
					<Group justify="flex-end" align="center">
						<Badge color="blue" variant="dot" size="sm">
							Modified
						</Badge>
					</Group>
				)}

				{/* Metadata section */}
				{showMetadata && item.hasSuccessfulMetadata && (
					<div className={dispositionStyles.metadata}>
						<AbookEntryMetadataDisplay item={item} />
					</div>
				)}
			</Stack>
		</Card>
	)
}
