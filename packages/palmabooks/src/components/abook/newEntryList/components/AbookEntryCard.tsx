import {
	AbookEntry,
	AbookEntryDisposition,
	AbookEntrySourceType,
	WithId,
} from "@teawithsand/booklibr"
import { useSetAtom } from "@teawithsand/fstate"
import { Text } from "@teawithsand/mlui"
import { useCallback } from "react"
import type { AbookEntryListBehavior } from "../behavior/AbookEntryListBehavior"
import styles from "./AbookEntryCard.module.scss"

interface AbookEntryCardProps {
	readonly entry: WithId<AbookEntry>
	readonly behavior: AbookEntryListBehavior
	readonly showMetadata?: boolean
}

/**
 * Entry card component for displaying basic entry information.
 * Uses CSS modules for styling instead of inline styles.
 */
export const AbookEntryCard = ({
	entry,
	behavior,
	showMetadata = true,
}: AbookEntryCardProps) => {
	const editEntry = useSetAtom(behavior.editEntry)

	const fileName =
		entry.data.data.source.type === AbookEntrySourceType.UPLOAD
			? entry.data.data.source.uploadFileName
			: `Entry ${entry.id}`

	const disposition = entry.data.data.disposition

	const handleDispositionChange = useCallback(
		async (newDisposition: AbookEntryDisposition) => {
			await editEntry(entry.id.toString(), async (original) => {
				return {
					...original,
					data: {
						...original.data,
						disposition: newDisposition,
					},
				}
			})
		},
		[editEntry, entry.id],
	)

	return (
		<div className={styles.entryCard}>
			<div className={styles.fileName}>
				<Text component="span">{fileName}</Text>
			</div>

			{showMetadata && (
				<div className={styles.metadata}>
					<div className={styles.metadataItem}>
						<Text component="span" size="sm">
							ID:
						</Text>
						<Text component="span" size="sm">
							{entry.id}
						</Text>
					</div>

					<div className={styles.metadataItem}>
						<Text component="span" size="sm">
							Status:
						</Text>
						<select
							value={disposition}
							onChange={(e) =>
								handleDispositionChange(
									e.target.value as AbookEntryDisposition,
								)
							}
							className={styles.dispositionSelect}
						>
							<option
								value={AbookEntryDisposition.PLAYABLE_AUDIO}
							>
								Playable Audio
							</option>
							<option value={AbookEntryDisposition.COVER_IMAGE}>
								Cover Image
							</option>
							<option value={AbookEntryDisposition.DESCRIPTION}>
								Description
							</option>
							<option value={AbookEntryDisposition.UNKNOWN}>
								Unknown
							</option>
						</select>
					</div>

					{entry.data.data.createdAt && (
						<div className={styles.metadataItem}>
							<Text component="span" size="sm">
								Created:
							</Text>
							<Text component="span" size="sm">
								{new Date(
									entry.data.data.createdAt.toNumberMillis(),
								).toLocaleDateString()}
							</Text>
						</div>
					)}
				</div>
			)}
		</div>
	)
}
