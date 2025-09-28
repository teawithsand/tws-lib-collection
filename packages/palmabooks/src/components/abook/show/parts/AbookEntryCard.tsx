import { useTransResolver } from "@/app/app.hooks"
import {
	BlobMetadataResultType,
	type AbookEntry,
	type WithId,
} from "@teawithsand/booklibr"
import { Text } from "@teawithsand/mlui"
import styles from "./AbookEntryCard.module.scss"

interface AbookEntryCardProps {
	readonly entry: WithId<AbookEntry>
	readonly index: number
}

export const AbookEntryCard = ({ entry, index }: AbookEntryCardProps) => {
	const { resolve } = useTransResolver()

	const formatDuration = (milliseconds: number): string => {
		return resolve((t) => t.util.time.formatDuration(milliseconds))
	}

	const hasAudioMetadata =
		entry.data.aggregate.metadata?.metadata.audio.type ===
		BlobMetadataResultType.SUCCESS

	const audioDuration = (() => {
		if (!hasAudioMetadata || !entry.data.aggregate.metadata) {
			return 0
		}

		const audioResult = entry.data.aggregate.metadata.metadata.audio
		if (audioResult.type === BlobMetadataResultType.SUCCESS) {
			return audioResult.metadata.duration
		}

		return 0
	})()

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
								? formatDuration(audioDuration)
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
