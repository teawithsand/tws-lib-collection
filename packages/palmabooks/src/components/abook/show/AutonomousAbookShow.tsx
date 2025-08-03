import type { AbookStoreService } from "@/domain/abookStore"
import { useAtomValue } from "@teawithsand/fstate"
import { AbookShow } from "./AbookShow"
import { AbookShowNotFound } from "./AbookShowNotFound"

interface AutonomousAbookShowProps {
	readonly abookServiceAtom: ReturnType<AbookStoreService["getAbook"]>
	readonly abookId: string
}

/**
 * Autonomous abook show component that handles data fetching and renders appropriate content.
 */
export const AutonomousAbookShow = ({
	abookServiceAtom,
	abookId,
}: AutonomousAbookShowProps) => {
	const abookData = useAtomValue(abookServiceAtom.data)
	const abookEntries = useAtomValue(abookServiceAtom.entries)

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
