import { useTransResolver } from "@/app/app.hooks"
import type { Abook } from "@teawithsand/booklibr"
import type { Timestamp } from "@teawithsand/lngext"
import { Text } from "@teawithsand/mlui"
import styles from "./AbookMetadataAside.module.scss"

interface AbookMetadataAsideProps {
	readonly abook: Abook
}

export const AbookMetadataAside = ({ abook }: AbookMetadataAsideProps) => {
	const { resolve } = useTransResolver()

	const formatDuration = (milliseconds: number): string => {
		return resolve((t) => t.util.time.formatDuration(milliseconds))
	}

	const formatDate = (timestamp: number | Date | Timestamp): string => {
		return resolve((t) => t.util.time.formatDate(timestamp))
	}

	return (
		<div className={styles.metadataAside}>
			<div className={styles.metadataCard}>
				<Text className={styles.metadataTitle}>
					{resolve((t) => t.abooks.preview.metadata)}
				</Text>

				<div className={styles.metadataItems}>
					<div className={styles.metadataItem}>
						<Text className={styles.metadataLabel}>
							{resolve((t) => t.abooks.preview.createdLabel)}
						</Text>
						<Text className={styles.metadataValue}>
							{formatDate(abook.data.header.createdAt)}
						</Text>
					</div>

					<div className={styles.metadataItem}>
						<Text className={styles.metadataLabel}>
							{resolve(
								(t) => t.abooks.preview.totalDurationLabel,
							)}
						</Text>
						<Text className={styles.metadataValue}>
							{formatDuration(
								abook.aggregate.totalDurationMillis,
							)}
						</Text>
					</div>

					<div className={styles.metadataItem}>
						<Text className={styles.metadataLabel}>
							{resolve((t) => t.abooks.preview.entriesLabel)}
						</Text>
						<Text className={styles.metadataValue}>
							{abook.aggregate.totalEntries}
						</Text>
					</div>
				</div>
			</div>
		</div>
	)
}
