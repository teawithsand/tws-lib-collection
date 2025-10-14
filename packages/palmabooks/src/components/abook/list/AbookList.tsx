import { Abook, WithId } from "@teawithsand/booklibr"
import { Atom, useAtomValue } from "@teawithsand/fstate"
import { LoadingFallback, SimpleGrid, useStableMemo } from "@teawithsand/mlui"
import { AbookListEmptyState } from "./AbookListEmptyState"
import { AbookView } from "./AbookView"
import styles from "./abookList.module.scss"
import { AbookListBehavior } from "./behavior/AbookListBehavior"

export const AbookList = ({
	abooksAtom,
}: {
	abooksAtom: Atom<Promise<WithId<Abook>[]>>
}) => {
	const behavior = useStableMemo(
		() => new AbookListBehavior(abooksAtom),
		[abooksAtom],
	)

	const loadable = useAtomValue(behavior.abooksLoadable)

	if (loadable.state === "loading") {
		return <LoadingFallback />
	}

	if (loadable.state === "hasError") {
		throw loadable.error
	}

	if (loadable.state !== "hasData") {
		return null
	}

	if (loadable.data.length === 0) {
		return <AbookListEmptyState />
	}

	return (
		<div className={styles.container}>
			<SimpleGrid
				cols={{ base: 1, sm: 2 }}
				spacing="md"
				className={styles.grid}
			>
				{loadable.data.map((abook, index) => (
					<AbookView key={`${abook.id}-${index}`} abook={abook} />
				))}
			</SimpleGrid>
		</div>
	)
}
