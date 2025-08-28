import { useTransResolver } from "@/app/app.hooks"
import type { AbookEntry, WithId } from "@teawithsand/booklibr"
import { Stack, Text } from "@teawithsand/mlui"
import styles from "./AbookEntriesSection.module.scss"
import { AbookEntryCard } from "./AbookEntryCard"

interface AbookEntriesSectionProps {
	readonly abookEntries: Array<WithId<AbookEntry>>
}

export const AbookEntriesSection = ({
	abookEntries,
}: AbookEntriesSectionProps) => {
	const { resolve } = useTransResolver()

	return (
		<div className={styles.entriesSection}>
			<Text className={styles.sectionTitle}>
				{resolve((t) => t.abooks.preview.entries)}
			</Text>

			{abookEntries.length === 0 ? (
				<div className={styles.emptyState}>
					<div className={styles.emptyIcon}>📚</div>
					<Text c="dimmed" size="lg">
						{resolve((t) => t.abooks.preview.noEntries)}
					</Text>
				</div>
			) : (
				<Stack gap="md">
					{abookEntries.map(
						(entry: WithId<AbookEntry>, index: number) => (
							<AbookEntryCard
								key={entry.id}
								entry={entry}
								index={index}
							/>
						),
					)}
				</Stack>
			)}
		</div>
	)
}
