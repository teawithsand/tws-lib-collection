import type { Abook, WithId } from "@teawithsand/booklibr"
import { Stack } from "@teawithsand/mlui"
import { AbookCard } from "./AbookCard"

export interface AbooksListProps {
	abooks: Array<WithId<Abook>>
	formatEntryCount: (count: number) => string
	formatDuration: (durationMillis: number) => string
	onAbookClick?: (abook: WithId<Abook>) => void
}

/**
 * List component for displaying multiple audiobooks.
 */
export const AbooksList = ({
	abooks,
	formatEntryCount,
	formatDuration,
	onAbookClick,
}: AbooksListProps) => {
	return (
		<Stack gap="md">
			{abooks.map((abook) => (
				<AbookCard
					key={abook.id}
					abook={abook}
					entryCountText={formatEntryCount(
						abook.data.aggregate.totalEntries,
					)}
					durationText={formatDuration(
						abook.data.aggregate.totalDurationMillis,
					)}
					onClick={onAbookClick}
				/>
			))}
		</Stack>
	)
}
