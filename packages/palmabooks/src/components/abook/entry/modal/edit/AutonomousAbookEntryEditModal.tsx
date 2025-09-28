import { useApp } from "@/app/app.hooks"
import type { AbookStoreServiceAbookAtoms } from "@/domain/abookStore"
import { AbookEntryData } from "@teawithsand/booklibr"
import { useAtomCallback, useAtomValue } from "@teawithsand/fstate"
import { useMantineNotifications } from "@teawithsand/mlui"
import { useCallback, useState } from "react"
import { AbookEntryEditModal } from "./AbookEntryEditModal"

const LOG_TAG = "AutonomousAbookEntryEditModal"

/**
 * Autonomous audiobook entry edit modal with built-in save logic.
 *
 * This component handles the complete edit flow internally, including:
 * - Calling the abook store service to update the entry
 * - Showing success/error notifications
 * - Proper error logging
 *
 * Use this when you want a complete, self-contained edit experience
 * without needing to handle the save logic in the parent component.
 */
interface AutonomousAbookEntryEditModalProps {
	readonly opened: boolean
	readonly onClose: () => void
	readonly abookServiceAtoms: AbookStoreServiceAbookAtoms
	readonly abookId: string
	readonly entryId: string
}

export function AutonomousAbookEntryEditModal({
	opened,
	onClose,
	abookServiceAtoms,
	abookId,
	entryId,
}: AutonomousAbookEntryEditModalProps) {
	const app = useApp()
	const notifications = useMantineNotifications()

	const [isLoading, setIsLoading] = useState(false)

	const entries = useAtomValue(abookServiceAtoms.entries)
	const entry = entries.find((e) => e.id === entryId)

	const handleSave = useAtomCallback(
		useCallback(
			async (_get, set, updatedData: AbookEntryData) => {
				if (!entry) {
					app.logger.error(LOG_TAG, "Entry not found for editing")
					return
				}

				setIsLoading(true)
				try {
					// Access the abook store to get the entry handle directly
					const handle =
						await app.abookStoreService.abookStore.get(abookId)
					const entryHandle = (await handle.listEntries()).find(
						(h) => h.id === entryId,
					)

					if (!entryHandle) {
						throw new Error("Entry handle not found")
					}

					// Update the entry data
					await entryHandle.write({ data: updatedData })

					// Recompute aggregate after update
					await set(abookServiceAtoms.computeAggregate)
					await set(abookServiceAtoms.refresh)

					onClose()

					notifications.show({
						title: "Entry updated successfully!",
						message: "The entry has been updated.",
						color: "green",
					})
				} catch (error) {
					app.logger.error(LOG_TAG, "Failed to update entry:", error)

					notifications.show({
						title: "Update Failed",
						message: "Failed to update entry",
						color: "red",
					})
				} finally {
					setIsLoading(false)
				}
			},
			[
				entry,
				abookServiceAtoms,
				entryId,
				abookId,
				app,
				notifications,
				onClose,
			],
		),
	)

	const handleClose = useCallback(() => {
		if (!isLoading) {
			onClose()
		}
	}, [isLoading, onClose])

	if (!entry) {
		return null
	}

	return (
		<AbookEntryEditModal
			opened={opened}
			onClose={handleClose}
			entryData={entry.data.data}
			onSave={handleSave}
		/>
	)
}
