import { useApp } from "@/app/app.hooks"
import { Abook, AbookEntry, WithId } from "@teawithsand/booklibr"
import { Atom, useAtomValue, useSetAtom } from "@teawithsand/fstate"
import { useCallback, useState } from "react"
import { AbookEntryDeleteModal } from "./AbookEntryDeleteModal"

export interface AutonomousAbookEntryDeleteModalProps {
	readonly opened: boolean
	readonly onClose: () => void
	readonly abookDataWithIdAtom: Atom<Promise<WithId<Abook | null>>>
	readonly entryDataWithIdAtom: Atom<Promise<WithId<AbookEntry | null>>>
	readonly onDeleted?: () => void
}

/**
 * Autonomous version of AbookEntryDeleteModal that integrates with Suspense.
 * Expects a parent Suspense boundary to handle loading states.
 * Reads both abook and entry data from atoms to display confirmation dialog.
 * Handles deletion logic and state management.
 */
export const AutonomousAbookEntryDeleteModal = ({
	opened,
	onClose,
	abookDataWithIdAtom,
	entryDataWithIdAtom,
	onDeleted,
}: AutonomousAbookEntryDeleteModalProps) => {
	const app = useApp()
	const abookWithId = useAtomValue(abookDataWithIdAtom)
	const entryWithId = useAtomValue(entryDataWithIdAtom)
	const refreshAbooksList = useSetAtom(
		app.abookStoreService.refreshAbooksList,
	)

	const [isDeleting, setIsDeleting] = useState(false)
	const [deleteError, setDeleteError] = useState<string | null>(null)
	const [deleteSuccess, setDeleteSuccess] = useState(false)

	const handleClose = useCallback(() => {
		if (!isDeleting) {
			setDeleteError(null)
			setDeleteSuccess(false)
			onClose()
		}
	}, [isDeleting, onClose])

	const handleDelete = useCallback(async () => {
		const abookId = abookWithId?.id
		const entryId = entryWithId?.id
		if (!abookId || !entryId) {
			return
		}

		setIsDeleting(true)
		setDeleteError(null)
		setDeleteSuccess(false)

		try {
			const abookHandle =
				await app.abookStoreService.abookStore.get(abookId)
			const entryHandles = await abookHandle.listEntries()
			const entryHandle = entryHandles.find((e) => e.id === entryId)

			if (!entryHandle) {
				throw new Error("Entry not found")
			}

			await entryHandle.delete()

			refreshAbooksList()
			setDeleteSuccess(true)

			if (onDeleted) {
				onDeleted()
			}

			setTimeout(() => {
				handleClose()
			}, 1500)
		} catch (error) {
			// TODO(teaiwthsand): here use trans error explainer instead
			setDeleteError(
				error instanceof Error
					? error.message
					: "Failed to delete entry",
			)
		} finally {
			setIsDeleting(false)
		}
	}, [
		abookWithId?.id,
		entryWithId?.id,
		app.abookStoreService.abookStore,
		onDeleted,
		refreshAbooksList,
		handleClose,
	])

	const resolvedAbook =
		abookWithId?.data === null ? null : (abookWithId?.data ?? null)
	const resolvedEntry =
		entryWithId?.data === null ? null : (entryWithId?.data ?? null)

	return (
		<AbookEntryDeleteModal
			opened={opened}
			onClose={handleClose}
			abook={resolvedAbook}
			entry={resolvedEntry}
			onDelete={handleDelete}
			isDeleting={isDeleting}
			deleteError={deleteError}
			deleteSuccess={deleteSuccess}
		/>
	)
}
