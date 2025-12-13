import { Routes } from "@/router"
import { Abook, WithId } from "@teawithsand/booklibr"
import { Atom, useAtomValue } from "@teawithsand/fstate"
import { useNavigation } from "@teawithsand/mlui"
import { useCallback } from "react"
import { AbookList } from "./AbookList"

export interface AutonomousAbookListProps {
	readonly abooksListAtom: Atom<Promise<WithId<Abook>[]>>
	onRefresh: () => void
}

/**
 * Audiobook list component that reads abook data from an atom.
 * Must be wrapped in Suspense.
 * Search state is managed internally by AbookList component.
 * Navigation to create page is handled internally.
 */
export const AutonomousAbookList = ({
	abooksListAtom,
	onRefresh,
}: AutonomousAbookListProps) => {
	const navigation = useNavigation()
	const abooks = useAtomValue(abooksListAtom)

	const handleCreateAbookClick = useCallback(() => {
		navigation.navigate(Routes.createAbook.navigate())
	}, [navigation])

	return (
		<AbookList
			abooks={abooks}
			onCreateAbookClick={handleCreateAbookClick}
			onRefresh={onRefresh}
		/>
	)
}
