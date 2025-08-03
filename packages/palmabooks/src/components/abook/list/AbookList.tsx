import type { Abook, WithId } from "@teawithsand/booklibr"
import { Stack } from "@teawithsand/mlui"
import { AbookListCard } from "./AbookListCard"
import { AbookListEmptyState } from "./AbookListEmptyState"

export interface AbooksListProps {
	abooks: Array<WithId<Abook>>
	onAbookClick?: (abook: WithId<Abook>) => void
}

/**
 * List component for displaying multiple audiobooks.
 */
export const AbookList = ({ abooks }: AbooksListProps) => {
	if (abooks.length === 0) {
		return <AbookListEmptyState />
	}

	return (
		<Stack gap="md">
			{abooks.map((abook) => (
				<AbookListCard key={abook.id} abook={abook} />
			))}
		</Stack>
	)
}
