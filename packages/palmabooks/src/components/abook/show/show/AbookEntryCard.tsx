import { useTransResolver } from "@/app/app.hooks"
import type { AbookEntry, WithId } from "@teawithsand/booklibr"
import { Text } from "@teawithsand/mlui"
import styles from "../AbookShow.module.scss"

interface AbookEntryCardProps {
	readonly entry: WithId<AbookEntry>
	readonly index: number
	readonly formatDuration: (milliseconds: number) => string
}

export const AbookEntryCard = ({
	entry,
	index,
	formatDuration,
}: AbookEntryCardProps) => {
	const { resolve } = useTransResolver()

	const hasAudioMetadata =
		entry.data.aggregate.metadata?.metadata.audio.type === "success"
	const audioDuration =
		hasAudioMetadata &&
		entry.data.aggregate.metadata?.metadata.audio.type === "success"
			? (
					entry.data.aggregate.metadata.metadata.audio as {
						metadata: {
							duration: number
						}
					}
				).metadata.duration
			: 0

	return (
		<div className={styles.entryCard}>
			<div className={styles.entryContent}>
				<Text className={styles.entryTitle}>
					{resolve((t) => t.abooks.preview.entryTitle(index))}
				</Text>

				<div className={styles.entryDetails}>
					<div className={styles.entryDetail}>
						<strong>
							{resolve((t) => t.abooks.preview.sourceLabel)}:
						</strong>
						<span>{entry.data.data.source.type}</span>
					</div>

					<div className={styles.entryDetail}>
						<strong>
							{resolve((t) => t.abooks.preview.durationLabel)}:
						</strong>
						<span>
							{audioDuration > 0
								? formatDuration(audioDuration * 1000)
								: resolve((t) => t.common.unknown)}
						</span>
					</div>

					<div className={styles.entryDetail}>
						<strong>
							{resolve((t) => t.abooks.preview.dispositionLabel)}:
						</strong>
						<span>{entry.data.data.disposition}</span>
					</div>
				</div>
			</div>
		</div>
	)
}
