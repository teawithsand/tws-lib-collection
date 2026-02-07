import { useApp } from "@/app/app.hooks"
import { Abook, IdUtil, WithId } from "@teawithsand/booklibr"
import { Atom, useAtomValue } from "@teawithsand/fstate"
import { useMemo } from "react"
import { AbookNotFound } from "../../show"
import { AbookEntryUpload } from "./AbookEntryUpload"
import { AbookEntryUploadBehavior } from "./AbookEntryUploadBehavior"

export interface AutonomousAbookEntryUploadProps {
	readonly abookDataWithIdAtom: Atom<Promise<WithId<Abook | null>>>
	readonly onUploadFinished?: () => void
}

/**
 * Autonomous version of AbookEntryUpload that integrates with Suspense.
 * Expects a parent Suspense boundary to handle loading states.
 */
export const AutonomousAbookEntryUpload = ({
	abookDataWithIdAtom,
	onUploadFinished,
}: AutonomousAbookEntryUploadProps) => {
	const app = useApp()
	const abookWithId = useAtomValue(abookDataWithIdAtom)

	const behavior = useMemo(() => {
		if (!abookWithId.data) return null

		const abook: WithId<Abook> = {
			id: abookWithId.id,
			data: abookWithId.data,
		}

		return new AbookEntryUploadBehavior(
			abook,
			app.abookStoreService,
			IdUtil.toString(abookWithId.id),
			onUploadFinished,
		)
	}, [app, abookWithId, onUploadFinished])

	if (!abookWithId || !abookWithId.data || !behavior) {
		return <AbookNotFound />
	}

	return <AbookEntryUpload behavior={behavior} />
}
