import type { Abook, WithId } from "@teawithsand/booklibr"
import { SimpleGrid } from "@teawithsand/mlui"
import styles from "./AbookList.module.scss"
import { AbookListCard } from "./AbookListCard"
import { AbookListEmptyState } from "./AbookListEmptyState"

export interface AbooksListProps {
	abooks: Array<WithId<Abook>>
	onAbookClick?: (abook: WithId<Abook>) => void
}

export const AbookList = ({ abooks }: AbooksListProps) => {
	if (abooks.length === 0) {
		return <AbookListEmptyState />
	}

	return (
		<div className={styles.container}>
			<SimpleGrid
				cols={{ base: 1, sm: 1, md: 2, lg: 2, xl: 2 }}
				spacing="lg"
				className={styles.grid}
			>
				{abooks.map((abook) => (
					<AbookListCard key={abook.id} abook={abook} />
				))}
			</SimpleGrid>
		</div>
	)
}
