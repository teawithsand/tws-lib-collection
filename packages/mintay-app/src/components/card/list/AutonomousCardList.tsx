import { Atom, useAtomValue } from "@teawithsand/fstate"
import { WithMintayId } from "../../../mintay"
import { AppCardData } from "../../../mintay/card/card"
import { CardList } from "./CardList"

interface AutonomousCardListProps {
	readonly cardsAtom: Atom<
		WithMintayId<AppCardData>[] | Promise<WithMintayId<AppCardData>[]>
	>
	readonly collectionId?: string
}

/**
 * Autonomous card list component that manages its own loading state
 * Takes an atom containing cards and automatically handles loading and error states
 */
export const AutonomousCardList = ({
	cardsAtom,
	collectionId,
}: AutonomousCardListProps) => {
	const cardsValue = useAtomValue(cardsAtom)

	return <CardList cards={cardsValue} collectionId={collectionId} />
}
