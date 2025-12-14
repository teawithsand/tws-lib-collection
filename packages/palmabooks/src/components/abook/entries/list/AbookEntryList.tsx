import { useTransResolver } from "@/app/app.hooks"
import { AbookEntry, WithId } from "@teawithsand/booklibr"
import { Atom, useAtomValue } from "@teawithsand/fstate"
import {
	Box,
	LoadingFallbackVariant,
	LoadingSuspenseBoundary,
	Stack,
	Text,
} from "@teawithsand/mlui"
import { useMemo } from "react"
import styles from "./AbookEntryList.module.scss"
import {
	AbookEntryListBehavior,
	AbookEntryListBehaviorContext,
	useAbookEntryListBehavior,
} from "./AbookEntryListBehavior"
import { AbookEntryCard } from "./card"
import { AbookEntryListTopBar } from "./topBar"

export interface AbookEntryListProps {
	readonly entriesAtom: Atom<Promise<WithId<AbookEntry>[]>>
	onRefresh: () => void
	onEntryClick: (entry: WithId<AbookEntry>) => void
}

export const AbookEntryList = ({
	entriesAtom,
	onEntryClick,
	onRefresh,
}: AbookEntryListProps) => {
	const behavior = useMemo(
		() => new AbookEntryListBehavior(entriesAtom, onRefresh, onEntryClick),
		[entriesAtom, onRefresh, onEntryClick],
	)
	return (
		<AbookEntryListBehaviorContext.Provider value={behavior}>
			<LoadingSuspenseBoundary variant={LoadingFallbackVariant.Inline}>
				<AbookEntryListContent />
			</LoadingSuspenseBoundary>
		</AbookEntryListBehaviorContext.Provider>
	)
}

/**
 * Mobile-first audiobook entry list component.
 * Displays entries in a simple vertical list sorted by ordinal number with integrated search functionality.
 */
const AbookEntryListContent = () => {
	const behavior = useAbookEntryListBehavior()

	const { resolve } = useTransResolver()

	const searchQuery = useAtomValue(behavior.filterText)
	const entries = useAtomValue(behavior.shownEntries)

	if (entries.length === 0 && !searchQuery) {
		return (
			<Box className={styles.emptyState}>
				<Stack align="center" gap="md">
					<Text size="lg" c="dimmed" ta="center">
						{resolve((t) => t.abook.entries.emptyState.noEntries)}
					</Text>
					<Text size="sm" c="dimmed" ta="center">
						{resolve(
							(t) => t.abook.entries.emptyState.noEntriesSubtext,
						)}
					</Text>
				</Stack>
			</Box>
		)
	}

	return (
		<>
			<AbookEntryListTopBar />
			{entries.length === 0 ? (
				<Box className={styles.emptyState}>
					<Stack align="center" gap="md">
						<Text size="lg" c="dimmed" ta="center">
							{resolve(
								(t) => t.abook.entries.emptyState.noEntries,
							)}
						</Text>
						<Text size="sm" c="dimmed" ta="center">
							{resolve(
								(t) =>
									t.abook.entries.emptyState
										.noMatchingEntries,
							)}
						</Text>
					</Stack>
				</Box>
			) : (
				<Stack gap="md" className={styles.list}>
					{entries.map((entry) => (
						<AbookEntryCard
							key={entry.id}
							entry={entry}
							onClick={() => behavior.onEntryClick(entry)}
						/>
					))}
				</Stack>
			)}
		</>
	)
}
