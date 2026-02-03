import { useTransResolver } from "@/app/app.hooks"
import { AbookEntry, WithId } from "@teawithsand/booklibr"
import { Atom, useAtomValue } from "@teawithsand/fstate"
import {
	Box,
	LoadingFallback,
	LoadingFallbackVariant,
	Stack,
	Text,
} from "@teawithsand/mlui"
import { ReactNode, useMemo } from "react"
import styles from "./AbookEntryList.module.scss"
import {
	AbookEntryListBehavior,
	AbookEntryListBehaviorContext,
	useAbookEntryListBehavior,
} from "./AbookEntryListBehavior"
import { AbookEntryCard } from "./card"
import { AbookEntrySelectionBar } from "./selectionBar"
import { AbookEntryListTopBar } from "./topBar"

export interface AbookEntryListProps {
	readonly entriesAtom: Atom<Promise<WithId<AbookEntry>[]>>
	onRefresh: () => void
	onEntryClick: (entry: WithId<AbookEntry>) => void
	readonly children?: ReactNode
	readonly onDeleteSelectedEntries?: (
		entries: WithId<AbookEntry>[],
	) => void | Promise<void>
}

export const AbookEntryList = ({
	entriesAtom,
	onEntryClick,
	onRefresh,
	children,
	onDeleteSelectedEntries,
}: AbookEntryListProps) => {
	const behavior = useMemo(
		() =>
			new AbookEntryListBehavior(
				entriesAtom,
				onRefresh,
				onEntryClick,
				onDeleteSelectedEntries,
			),
		[entriesAtom, onEntryClick, onDeleteSelectedEntries, onRefresh],
	)
	return (
		<AbookEntryListBehaviorContext.Provider value={behavior}>
			{children}
			<AbookEntryListContent />
		</AbookEntryListBehaviorContext.Provider>
	)
}

const InnerList = () => {
	const behavior = useAbookEntryListBehavior()
	const entriesLoadable = useAtomValue(behavior.shownEntriesLoadable)
	const searchQuery = useAtomValue(behavior.filterText)

	const { resolve } = useTransResolver()
	if (entriesLoadable.state === "loading") {
		return <LoadingFallback variant={LoadingFallbackVariant.Inline} />
	}

	if (entriesLoadable.state === "hasError") {
		return (
			<Box className={styles.emptyState}>
				<Stack align="center" gap="md">
					<Text size="sm" c="dimmed" ta="center">
						{resolve((t) => t.common.error)}
					</Text>
				</Stack>
			</Box>
		)
	}

	const entries = entriesLoadable.data
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
							onCardClick={() => behavior.onEntryClick(entry)}
							onActionClick={() => behavior.onEntryClick(entry)}
						/>
					))}
				</Stack>
			)}
		</>
	)
}

const AbookEntryListContent = () => {
	// const behavior = useAbookEntryListBehavior()

	return (
		<>
			<div className={styles.stickyBars}>
				<AbookEntryListTopBar />
				<AbookEntrySelectionBar />
			</div>
			<InnerList />
		</>
	)
}
