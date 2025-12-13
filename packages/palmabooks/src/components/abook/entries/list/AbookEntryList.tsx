import { useTransResolver } from "@/app/app.hooks"
import {
	AbookEntry,
	AbookEntryDisposition,
	WithId,
} from "@teawithsand/booklibr"
import { Box, Stack, Text } from "@teawithsand/mlui"
import { useMemo, useState } from "react"
import styles from "./AbookEntryList.module.scss"
import { AbookEntryCard } from "./card"
import { AbookEntrySortOption } from "./modal"
import { AbookEntryListTopBar } from "./topBar"

export interface AbookEntryListProps {
	readonly entries: WithId<AbookEntry>[]
	onRefresh: () => void
	onEntryClick: (entry: WithId<AbookEntry>) => void
}

/**
 * Mobile-first audiobook entry list component.
 * Displays entries in a simple vertical list sorted by ordinal number with integrated search functionality.
 */
export const AbookEntryList = ({
	entries,
	onRefresh,
	onEntryClick,
}: AbookEntryListProps) => {
	const { resolve } = useTransResolver()
	const [searchQuery, setSearchQuery] = useState("")
	const [sortOption, setSortOption] = useState<AbookEntrySortOption>(
		AbookEntrySortOption.ORDINAL_NUMBER_ASC,
	)
	const [selectedDispositions, setSelectedDispositions] = useState<
		Set<AbookEntryDisposition>
	>(new Set(Object.values(AbookEntryDisposition)))

	const filteredEntries = useMemo(() => {
		let filtered = entries

		if (searchQuery) {
			filtered = filtered.filter((entry) =>
				entry.data.data.name
					?.toLowerCase()
					.includes(searchQuery.toLowerCase()),
			)
		}

		if (
			selectedDispositions.size <
			Object.values(AbookEntryDisposition).length
		) {
			filtered = filtered.filter((entry) =>
				selectedDispositions.has(entry.data.data.disposition),
			)
		}

		return filtered
	}, [entries, searchQuery, selectedDispositions])

	const sortedEntries = useMemo(() => {
		const sorted = [...filteredEntries]

		if (sortOption === AbookEntrySortOption.ORDINAL_NUMBER_ASC) {
			return sorted.sort(
				(a, b) => a.data.data.ordinalNumber - b.data.data.ordinalNumber,
			)
		}

		if (sortOption === AbookEntrySortOption.ORDINAL_NUMBER_DESC) {
			return sorted.sort(
				(a, b) => b.data.data.ordinalNumber - a.data.data.ordinalNumber,
			)
		}

		if (sortOption === AbookEntrySortOption.NAME_ASC) {
			return sorted.sort((a, b) =>
				(a.data.data.name || "").localeCompare(b.data.data.name || ""),
			)
		}

		if (sortOption === AbookEntrySortOption.NAME_DESC) {
			return sorted.sort((a, b) =>
				(b.data.data.name || "").localeCompare(a.data.data.name || ""),
			)
		}

		return sorted
	}, [filteredEntries, sortOption])

	if (sortedEntries.length === 0 && !searchQuery) {
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
			<AbookEntryListTopBar
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				sortOption={sortOption}
				onSortChange={setSortOption}
				selectedDispositions={selectedDispositions}
				onDispositionsChange={setSelectedDispositions}
				onRefresh={onRefresh}
			/>
			{sortedEntries.length === 0 ? (
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
					{sortedEntries.map((entry) => (
						<AbookEntryCard
							key={entry.id}
							entry={entry}
							onClick={() => onEntryClick(entry)}
						/>
					))}
				</Stack>
			)}
		</>
	)
}
