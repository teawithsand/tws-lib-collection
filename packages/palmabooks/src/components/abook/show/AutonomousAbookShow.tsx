import { Abook, WithId } from "@teawithsand/booklibr"
import { Atom, useAtomValue } from "@teawithsand/fstate"
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

	if (!abookWithId || !abookWithId.data) {
		return <AbookNotFound />
	}

	return <AbookShow abook={abookWithId.data} />
}
