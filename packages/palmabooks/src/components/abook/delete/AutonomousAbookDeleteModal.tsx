import { useApp } from "@/app/app.hooks"
import { Routes } from "@/router"
import { Abook, WithId } from "@teawithsand/booklibr"
import { Atom, useAtomValue, useSetAtom } from "@teawithsand/fstate"
import { useNavigation } from "@teawithsand/mlui"
import { useCallback, useState } from "react"
import { AbookDeleteModal } from "./AbookDeleteModal"

export interface AutonomousAbookDeleteModalProps {
	readonly opened: boolean
	readonly onClose: () => void
	readonly abookDataWithIdAtom: Atom<Promise<WithId<Abook | null>>>
	readonly onDeleted?: () => void
}

/**
 * Autonomous version of AbookDeleteModal that integrates with Suspense.
 * Expects a parent Suspense boundary to handle loading states.
 * Reads abook data from an atom to display the audiobook title in the confirmation dialog.
 * Handles deletion logic and state management.
 */
export const AutonomousAbookDeleteModal = ({
	opened,
	onClose,
	abookDataWithIdAtom,
	onDeleted,
}: AutonomousAbookDeleteModalProps) => {
	const app = useApp()
	const navigation = useNavigation()
	const abookWithId = useAtomValue(abookDataWithIdAtom)
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
		if (!abookId) {
			return
		}

		setIsDeleting(true)
		setDeleteError(null)
		setDeleteSuccess(false)

		try {
			const handle = await app.abookStoreService.abookStore.get(abookId)
			await handle.delete()

			refreshAbooksList()
			setDeleteSuccess(true)

			if (onDeleted) {
				onDeleted()
			}

			setTimeout(() => {
				navigation.navigate(Routes.home.navigate())
				handleClose()
			}, 1500)
		} catch (error) {
			setDeleteError(
				error instanceof Error
					? error.message
					: "Failed to delete audiobook",
			)
		} finally {
			setIsDeleting(false)
		}
	}, [
		abookWithId?.id,
		app.abookStoreService.abookStore,
		onDeleted,
		refreshAbooksList,
		navigation,
		handleClose,
	])

	return (
		<AbookDeleteModal
			opened={opened}
			onClose={handleClose}
			abook={abookWithId?.data ?? null}
			onDelete={handleDelete}
			isDeleting={isDeleting}
			deleteError={deleteError}
			deleteSuccess={deleteSuccess}
		/>
	)
}
