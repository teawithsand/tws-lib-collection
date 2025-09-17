import type { AbookStoreServiceAbookAtoms } from "@/domain/abookStore"
import { Routes } from "@/router"
import { useAtomValue } from "@teawithsand/fstate"
import { useNavigation } from "@teawithsand/mlui"
import { useCallback } from "react"
import { AutonomousAbookDeleteModal } from "../modal/delete/AutonomousAbookDeleteModal"
import { useAbookDeleteModal } from "../modal/delete/useAbookDeleteModal"
import { AbookShow } from "./AbookShow"
import { AbookShowNotFound } from "./AbookShowNotFound"

interface AutonomousAbookShowProps {
	readonly abookServiceAtoms: AbookStoreServiceAbookAtoms
	readonly abookId: string
}

/**
 * Autonomous abook show component that handles data fetching and renders appropriate content.
 */
export const AutonomousAbookShow = ({
	abookServiceAtoms,
	abookId,
}: AutonomousAbookShowProps) => {
	const abookData = useAtomValue(abookServiceAtoms.data)
	const abookEntries = useAtomValue(abookServiceAtoms.entries)

	const { navigate } = useNavigation()
	const deleteModal = useAbookDeleteModal()

	const handleEditClick = useCallback(() => {
		navigate(Routes.editBook.navigate(abookId))
	}, [navigate, abookId])

	const handleDeleteClick = useCallback(() => {
		if (abookData) {
			deleteModal.openModal(abookId, abookData.data.header.metadata.title)
		}
	}, [deleteModal, abookId, abookData])

	const handleUploadClick = useCallback(() => {
		navigate(Routes.uploadFiles.navigate(abookId))
	}, [navigate, abookId])

	const handleFileListClick = useCallback(() => {
		navigate(Routes.fileList.navigate(abookId))
	}, [navigate, abookId])

	if (!abookData) {
		return <AbookShowNotFound />
	}

	return (
		<>
			<AbookShow
				abook={abookData}
				abookEntries={abookEntries}
				abookId={abookId}
				onEditClick={handleEditClick}
				onDeleteClick={handleDeleteClick}
				onUploadClick={handleUploadClick}
				onFileListClick={handleFileListClick}
			/>

			<AutonomousAbookDeleteModal
				opened={deleteModal.opened}
				onClose={deleteModal.closeModal}
				abookId={deleteModal.abookId}
				abookTitle={deleteModal.abookTitle}
			/>
		</>
	)
}
