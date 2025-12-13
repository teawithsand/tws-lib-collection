import { useApp } from "@/app/app.hooks"
import { Routes } from "@/router/routes"
import { Abook, WithId } from "@teawithsand/booklibr"
import { Atom, useAtomValue } from "@teawithsand/fstate"
import { useNavigation } from "@teawithsand/mlui"
import { useCallback } from "react"
import { AbookNotFound } from "../show/AbookNotFound"
import { AbookEdit, AbookEditData } from "./AbookEdit"

export interface AutonomousAbookEditProps {
	readonly abookDataWithIdAtom: Atom<Promise<WithId<Abook | null>>>
}

/**
 * Autonomous version of AbookEdit that integrates with Suspense.
 * Expects a parent Suspense boundary to handle loading states.
 * Handles onSubmit internally by updating the abook in the store.
 */
export const AutonomousAbookEdit = ({
	abookDataWithIdAtom,
}: AutonomousAbookEditProps) => {
	const app = useApp()
	const navigation = useNavigation()
	const abookWithId = useAtomValue(abookDataWithIdAtom)

	const handleSubmit = useCallback(
		async (data: AbookEditData) => {
			if (!abookWithId?.data) return

			const abookAtoms = app.abookStoreService.getAbook(abookWithId.id)
			await app.atomStore.set(abookAtoms.update, {
				data: {
					createdAt: abookWithId.data.data.header.createdAt,
					metadata: {
						title: data.title,
						description: data.description,
						privateUserNote: data.privateNote,
					},
					position: abookWithId.data.data.header.position,
				},
			})
			app.atomStore.set(app.abookStoreService.refreshAbooksList)
			navigation.navigate(
				Routes.abookShow.navigate(abookWithId.id.toString()),
				{
					replace: true,
				},
			)
		},
		[app, navigation, abookWithId],
	)

	if (!abookWithId || !abookWithId.data) {
		return <AbookNotFound />
	}

	return (
		<AbookEdit
			abook={abookWithId as WithId<Abook>}
			onSubmit={handleSubmit}
		/>
	)
}
