import { Routes } from "@/router"
import { Abook, WithId } from "@teawithsand/booklibr"
import { Atom, useAtomValue } from "@teawithsand/fstate"
import { useNavigation } from "@teawithsand/mlui"
import { useCallback } from "react"
import { AutonomousAbookDeleteModal, useAbookDeleteModal } from "../delete"
import { AbookNotFound } from "./AbookNotFound"
import { AbookShow } from "./AbookShow"

export interface AutonomousAbookShowProps {
	readonly abookDataWithIdAtom: Atom<Promise<WithId<Abook | null>>>
}

/**
 * Autonomous version of AbookShow that integrates with Suspense.
 * Expects a parent Suspense boundary to handle loading states.
 */
export const AutonomousAbookShow = ({
	abookDataWithIdAtom,
}: AutonomousAbookShowProps) => {
	const abookWithId = useAtomValue(abookDataWithIdAtom)
	const navigation = useNavigation()
	const deleteModal = useAbookDeleteModal()

	const handleEdit = useCallback(() => {
		if (abookWithId?.id) {
			navigation.navigate(
				Routes.abookEdit.navigate(String(abookWithId.id)),
			)
		}
	}, [abookWithId?.id, navigation])

	const handleDelete = useCallback(() => {
		if (abookWithId?.id) {
			deleteModal.openModal(abookWithId.id)
		}
	}, [abookWithId?.id, deleteModal])

	const handleViewEntries = useCallback(() => {
		if (abookWithId?.id) {
			navigation.navigate(
				Routes.abookEntries.navigate(String(abookWithId.id)),
			)
		}
	}, [abookWithId?.id, navigation])

	if (!abookWithId || !abookWithId.data) {
		return <AbookNotFound />
	}

	return (
		<>
			<AbookShow
				abook={abookWithId.data}
				onEdit={handleEdit}
				onDelete={handleDelete}
				onViewEntries={handleViewEntries}
			/>
			<AutonomousAbookDeleteModal
				opened={deleteModal.opened}
				onClose={deleteModal.closeModal}
				abookDataWithIdAtom={abookDataWithIdAtom}
			/>
		</>
	)
}
