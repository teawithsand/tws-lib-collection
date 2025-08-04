import type { AbookStoreServiceAbookAtoms } from "@/domain/abookStore"
import { useAtomValue } from "@teawithsand/fstate"
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

	if (!abookData) {
		return <AbookShowNotFound />
	}

	return (
		<AbookShow
			abook={abookData}
			abookEntries={abookEntries}
			abookId={abookId}
		/>
	)
}
