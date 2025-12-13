import { useApp } from "@/app/app.hooks"
import { Routes } from "@/router/routes"
import { useAtom } from "@teawithsand/fstate"
import { LoadingSuspenseBoundary, useNavigation } from "@teawithsand/mlui"
import { useCallback } from "react"
import { AbookShow } from "./AbookShow"

export interface AutonomousAbookShowProps {
	readonly id: string
}

/**
 * Autonomous component that fetches and displays audiobook details.
 * Handles data loading and action callbacks.
 */
export const AutonomousAbookShow = ({ id }: AutonomousAbookShowProps) => {
	const { abookStoreService } = useApp()
	const { navigate } = useNavigation()
	const abookAtoms = abookStoreService.getAbook(id)

	const [abookData] = useAtom(abookAtoms.dataWithId)
	const [, deleteAbook] = useAtom(abookAtoms.delete)

	const handleDelete = useCallback(async () => {
		if (confirm("Are you sure you want to delete this audiobook?")) {
			await deleteAbook()
			navigate(Routes.listAbooks.navigate())
		}
	}, [deleteAbook, navigate])

	const handleEdit = useCallback(() => {
		// TODO: Implement edit page
		alert("Edit functionality not yet implemented")
	}, [])

	const handlePreview = useCallback(() => {
		// TODO: Implement player
		alert("Player functionality not yet implemented")
	}, [])

	const handleAddFiles = useCallback(() => {
		// TODO: Implement add files to existing audiobook
		alert("Add files functionality not yet implemented")
	}, [])

	if (!abookData.data) {
		return null
	}

	return (
		<LoadingSuspenseBoundary>
			<AbookShow
				abook={{ id: abookData.id, data: abookData.data }}
				onDelete={handleDelete}
				onEdit={handleEdit}
				onPreview={handlePreview}
				onAddFiles={handleAddFiles}
			/>
		</LoadingSuspenseBoundary>
	)
}
