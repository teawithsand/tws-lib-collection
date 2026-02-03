import { useTransResolver } from "@/app/app.hooks"
import {
	IconClock,
	IconEye,
	IconFileMusic,
	IconFileText,
	IconPhoto,
	IconQuestionMark,
} from "@tabler/icons-react"
import {
	AbookEntry,
	AbookEntryDisposition,
	BlobMetadataResultType,
	WithId,
} from "@teawithsand/booklibr"
import { useAtomValue, useSetAtom } from "@teawithsand/fstate"
import {
	ActionIcon,
	Card,
	Checkbox,
	Group,
	MluiBreakpoint,
	Stack,
	Text,
	ThemeIcon,
	useBreakpoint,
} from "@teawithsand/mlui"
import { ReactNode, useRef } from "react"
import { useAbookEntryListBehavior } from "../AbookEntryListBehavior"
import styles from "./AbookEntryCard.module.scss"
import { useLongPressSelection } from "./useLongPressSelection"

export interface AbookEntryCardProps {
	readonly entry: WithId<AbookEntry>
	readonly onCardClick?: () => void
	readonly onActionClick?: () => void
}

const getDispositionIcon = (disposition: AbookEntryDisposition): ReactNode => {
	switch (disposition) {
		case AbookEntryDisposition.PLAYABLE_AUDIO:
			return <IconFileMusic size={20} />
		case AbookEntryDisposition.COVER_IMAGE:
			return <IconPhoto size={20} />
		case AbookEntryDisposition.DESCRIPTION:
			return <IconFileText size={20} />
		case AbookEntryDisposition.UNKNOWN:
		default:
			return <IconQuestionMark size={20} />
	}
}

const getDispositionColor = (disposition: AbookEntryDisposition): string => {
	switch (disposition) {
		case AbookEntryDisposition.PLAYABLE_AUDIO:
			return "blue"
		case AbookEntryDisposition.COVER_IMAGE:
			return "grape"
		case AbookEntryDisposition.DESCRIPTION:
			return "cyan"
		case AbookEntryDisposition.UNKNOWN:
		default:
			return "gray"
	}
}

const formatFileSize = (bytes: number | null | undefined): string => {
	if (!bytes || bytes <= 0) return "Unknown"

	const units = ["B", "KB", "MB", "GB"]
	let size = bytes
	let unitIndex = 0

	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024
		unitIndex++
	}

	return `${size.toFixed(1)} ${units[unitIndex]}`
}

const formatDuration = (milliseconds: number | null | undefined): string => {
	if (!milliseconds || milliseconds <= 0) return "Unknown"

	const totalSeconds = Math.floor(milliseconds / 1000)
	const hours = Math.floor(totalSeconds / 3600)
	const minutes = Math.floor((totalSeconds % 3600) / 60)
	const seconds = totalSeconds % 60

	if (hours > 0) {
		return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
	}
	return `${minutes}:${String(seconds).padStart(2, "0")}`
}

/**
 * Individual audiobook entry card component for list display.
 * Mobile-first design with disposition icon and metadata.
 */
export const AbookEntryCard = ({
	entry,
	onCardClick,
	onActionClick,
}: AbookEntryCardProps) => {
	const { resolve } = useTransResolver()
	const { data, aggregate } = entry.data
	const breakpoint = useBreakpoint()
	const isNarrow = breakpoint.isAtMost(MluiBreakpoint.MD)
	const behavior = useAbookEntryListBehavior()
	const isSelectedFn = useAtomValue(behavior.isEntrySelected)
	const selected = isSelectedFn(entry)
	const setEntrySelection = useSetAtom(behavior.setEntrySelection)
	const showCheckboxesLoadable = useAtomValue(
		behavior.isAtLeastOneEntrySelectedLoadable,
	)
	const shouldShowCheckboxes =
		!isNarrow ||
		(showCheckboxesLoadable.state === "hasData" &&
			showCheckboxesLoadable.data)

	const checkboxRef = useRef<HTMLDivElement>(null)
	const actionsRef = useRef<HTMLDivElement>(null)

	const handleCheckboxChange = (eOrChecked?: unknown) => {
		// stop propagation so card onClick doesn't fire
		if (
			eOrChecked &&
			typeof (eOrChecked as Event).stopPropagation === "function"
		) {
			;(eOrChecked as Event).stopPropagation()
		}

		const newChecked =
			typeof eOrChecked === "boolean" ? eOrChecked : !selected
		// write atom: entry, selected
		setEntrySelection(entry, newChecked)
	}

	const longPressHandlers = useLongPressSelection({
		onLongPress: () => setEntrySelection(entry, true),
		ignoreElements: [checkboxRef, actionsRef],
	})

	const handleCardClick = () => {
		onCardClick?.()
	}

	const handleActionClick = (event: React.MouseEvent) => {
		event.stopPropagation()
		onActionClick?.()
	}

	const audioMetadata = aggregate.metadata?.metadata.audio
	const duration =
		data.disposition === AbookEntryDisposition.PLAYABLE_AUDIO &&
		audioMetadata?.type === BlobMetadataResultType.SUCCESS
			? audioMetadata.metadata.duration
			: null

	return (
		<Card
			padding="md"
			shadow="sm"
			withBorder
			className={styles.card}
			onClick={handleCardClick}
			onPointerDown={longPressHandlers.onPointerDown}
			onPointerUp={longPressHandlers.onPointerUp}
			onPointerLeave={longPressHandlers.onPointerLeave}
			onPointerCancel={longPressHandlers.onPointerCancel}
			onPointerMove={longPressHandlers.onPointerMove}
		>
			<Group gap="md" align="center" wrap="nowrap">
				{shouldShowCheckboxes && (
					<div
						ref={checkboxRef}
						className={styles.checkbox}
						onClick={(event) => event.stopPropagation()}
					>
						<Checkbox
							size="lg"
							checked={selected}
							onChange={handleCheckboxChange}
						/>
					</div>
				)}
				<ThemeIcon
					size="lg"
					radius="md"
					color={getDispositionColor(data.disposition)}
					className={styles.icon}
				>
					{getDispositionIcon(data.disposition)}
				</ThemeIcon>

				<Stack gap="xs" className={styles.content}>
					<Text fw={600} lineClamp={1} className={styles.name}>
						{data.name || resolve((t) => t.abook.view.unknown)}
					</Text>

					<Group gap="md" wrap="wrap">
						{aggregate.blobSize !== null && (
							<Group gap="xs">
								<Text size="xs" c="dimmed">
									{formatFileSize(aggregate.blobSize)}
								</Text>
							</Group>
						)}

						{duration && (
							<Group gap="xs">
								<IconClock size={14} />
								<Text size="xs" c="dimmed">
									{formatDuration(duration)}
								</Text>
							</Group>
						)}
					</Group>
				</Stack>
				<div ref={actionsRef} className={styles.actions}>
					<ActionIcon
						variant="light"
						size="lg"
						aria-label={resolve(
							(t) => t.abook.entries.preview.openEntry,
						)}
						onClick={handleActionClick}
					>
						<IconEye size={18} />
					</ActionIcon>
				</div>
			</Group>
		</Card>
	)
}
