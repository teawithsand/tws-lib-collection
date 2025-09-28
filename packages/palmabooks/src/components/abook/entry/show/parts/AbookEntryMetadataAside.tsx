import { useTransResolver } from "@/app/app.hooks"
import {
	AbookEntrySourceType,
	type AbookEntry,
	type WithId,
} from "@teawithsand/booklibr"
import type { Timestamp } from "@teawithsand/lngext"
import { Text } from "@teawithsand/mlui"
import styles from "./AbookEntryMetadataAside.module.scss"

interface AbookEntryMetadataAsideProps {
	readonly entry: WithId<AbookEntry>
}

/**
 * Metadata aside section for audiobook entry showing detailed information.
 */
export const AbookEntryMetadataAside = ({
	entry,
}: AbookEntryMetadataAsideProps) => {
	const { resolve } = useTransResolver()

	const entryData = entry.data
	const source = entryData.data.source

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
							{formatDate(entryData.data.createdAt)}
						</Text>
					</div>

					<div className={styles.metadataItem}>
						<Text className={styles.metadataLabel}>
							{resolve((t) => t.abooks.preview.dispositionLabel)}
						</Text>
						<Text className={styles.metadataValue}>
							{entryData.data.disposition}
						</Text>
					</div>

					<div className={styles.metadataItem}>
						<Text className={styles.metadataLabel}>
							{resolve((t) => t.abooks.preview.sourceLabel)}
						</Text>
						<Text className={styles.metadataValue}>
							{source.type}
						</Text>
					</div>

					{source.type === AbookEntrySourceType.UPLOAD && (
						<>
							<div className={styles.metadataItem}>
								<Text className={styles.metadataLabel}>
									{resolve(
										(t) => t.abooks.entry.metadata.fileName,
									)}
								</Text>
								<Text className={styles.metadataValue}>
									{source.uploadFileName}
								</Text>
							</div>

							<div className={styles.metadataItem}>
								<Text className={styles.metadataLabel}>
									{resolve((t) => t.fileList.type)}
								</Text>
								<Text className={styles.metadataValue}>
									{source.uploadFileMime}
								</Text>
							</div>

							<div className={styles.metadataItem}>
								<Text className={styles.metadataLabel}>
									{resolve(
										(t) => t.abooks.entry.metadata.uploaded,
									)}
								</Text>
								<Text className={styles.metadataValue}>
									{formatDate(source.uploadedAt)}
								</Text>
							</div>
						</>
					)}

					<div className={styles.metadataItem}>
						<Text className={styles.metadataLabel}>
							{resolve(
								(t) => t.abooks.entry.metadata.ordinalLabel,
							)}
						</Text>
						<Text className={styles.metadataValue}>
							{entryData.data.ordinalNumber}
						</Text>
					</div>

					{entryData.aggregate.metadata && (
						<div className={styles.metadataItem}>
							<Text className={styles.metadataLabel}>
								{resolve(
									(t) =>
										t.abooks.entry.metadata.extractedLabel,
								)}
							</Text>
							<Text className={styles.metadataValue}>
								{formatDate(
									entryData.aggregate.metadata
										.extractTimestamp,
								)}
							</Text>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
