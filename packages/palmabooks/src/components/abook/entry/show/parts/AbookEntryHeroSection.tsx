import { useTransResolver } from "@/app/app.hooks"
import {
	BlobMetadataResultType,
	type AbookEntry,
	type WithId,
} from "@teawithsand/booklibr"
import { Text } from "@teawithsand/mlui"
import styles from "./AbookEntryHeroSection.module.scss"

interface AbookEntryHeroSectionProps {
	readonly entry: WithId<AbookEntry>
}

/**
 * Hero section for audiobook entry showing disposition and basic stats.
 */
export const AbookEntryHeroSection = ({
	entry,
}: AbookEntryHeroSectionProps) => {
	const { resolve } = useTransResolver()

	const entryData = entry.data
	const hasMetadata = entryData.aggregate.metadata !== null
	const blobSize = entryData.aggregate.blobSize

	const formatDuration = (milliseconds: number): string => {
		return resolve((t) => t.util.time.formatDuration(milliseconds))
	}

	const formatSize = (bytes: number): string => {
		return resolve((t) => t.util.formatSize(bytes))
	}

	const audioDuration =
		hasMetadata &&
		entryData.aggregate.metadata?.metadata.audio.type ===
			BlobMetadataResultType.SUCCESS
			? entryData.aggregate.metadata.metadata.audio.metadata.duration
			: null

	return (
		<div className={styles.heroSection}>
			<div className={styles.heroContent}>
				<div className={styles.statsRow}>
					<div className={styles.statItem}>
						<span className={styles.statValue}>
							{entryData.data.disposition}
						</span>
						<Text className={styles.statLabel}>
							{resolve((t) => t.abooks.preview.dispositionLabel)}
						</Text>
					</div>

					{audioDuration && (
						<div className={styles.statItem}>
							<span className={styles.statValue}>
								{formatDuration(audioDuration)}
							</span>
							<Text className={styles.statLabel}>
								{resolve((t) => t.abooks.preview.durationLabel)}
							</Text>
						</div>
					)}

					{blobSize && (
						<div className={styles.statItem}>
							<span className={styles.statValue}>
								{formatSize(blobSize)}
							</span>
							<Text className={styles.statLabel}>
								{resolve((t) => t.fileList.size)}
							</Text>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
