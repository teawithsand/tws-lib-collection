import { useTransResolver } from "@/app/app.hooks"
import { AbookEntryEditModal } from "@/components/abook/entry/modal/edit"
import { Routes } from "@/router/routes"
import {
	AbookEntry,
	AbookEntryData,
	AbookEntryDisposition,
	AbookEntrySourceType,
	WithId,
} from "@teawithsand/booklibr"
import { useSetAtom } from "@teawithsand/fstate"
import { Button, Link, Text } from "@teawithsand/mlui"
import { useCallback, useState } from "react"
import type { AbookEntryListBehavior } from "../behavior/AbookEntryListBehavior"
import styles from "./AbookEntryCard.module.scss"

interface AbookEntryCardProps {
	readonly entry: WithId<AbookEntry>
	readonly behavior: AbookEntryListBehavior
	readonly showMetadata?: boolean
	readonly abookId: string
}

/**
 * Entry card component for displaying basic entry information.
 * Uses CSS modules for styling instead of inline styles.
 */
export const AbookEntryCard = ({
	entry,
	behavior,
	showMetadata = true,
	abookId,
}: AbookEntryCardProps) => {
	const editEntry = useSetAtom(behavior.editEntry)
	const { resolve } = useTransResolver()
	const [isEditModalOpen, setIsEditModalOpen] = useState(false)

	const fileName =
		entry.data.data.source.type === AbookEntrySourceType.UPLOAD
			? entry.data.data.source.uploadFileName
			: resolve((t) =>
					t.abooks.preview.entryTitle(
						parseInt(entry.id.toString(), 10),
					),
				)

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

	const handleEditSave = useCallback(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		async (updatedData: AbookEntryData, _originalData: AbookEntryData) => {
			await editEntry(entry.id.toString(), async (original) => {
				return {
					...original,
					data: {
						...original.data,
						name: updatedData.name,
						disposition: updatedData.disposition,
						ordinalNumber: updatedData.ordinalNumber,
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

			<div className={styles.actions}>
				<Button
					component={Link}
					to={Routes.entryShow.navigate(abookId, entry.id.toString())}
					size="sm"
					variant="outline"
				>
					View
				</Button>
				<Button
					size="sm"
					variant="outline"
					onClick={() => setIsEditModalOpen(true)}
				>
					Edit
				</Button>
			</div>

			{showMetadata && (
				<div className={styles.metadata}>
					<div className={styles.metadataItem}>
						<Text component="span" size="sm">
							{resolve((t) => t.common.unknown)}:
						</Text>
						<Text component="span" size="sm">
							{entry.id}
						</Text>
					</div>

					<div className={styles.metadataItem}>
						<Text component="span" size="sm">
							{resolve((t) => t.abooks.preview.dispositionLabel)}:
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
								{AbookEntryDisposition.PLAYABLE_AUDIO}
							</option>
							<option value={AbookEntryDisposition.COVER_IMAGE}>
								{AbookEntryDisposition.COVER_IMAGE}
							</option>
							<option value={AbookEntryDisposition.DESCRIPTION}>
								{AbookEntryDisposition.DESCRIPTION}
							</option>
							<option value={AbookEntryDisposition.UNKNOWN}>
								{AbookEntryDisposition.UNKNOWN}
							</option>
						</select>
					</div>

					{entry.data.data.createdAt && (
						<div className={styles.metadataItem}>
							<Text component="span" size="sm">
								{resolve((t) => t.abooks.preview.createdLabel)}:
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

			<AbookEntryEditModal
				opened={isEditModalOpen}
				entryData={entry.data.data}
				onClose={() => setIsEditModalOpen(false)}
				onSave={handleEditSave}
			/>
		</div>
	)
}
