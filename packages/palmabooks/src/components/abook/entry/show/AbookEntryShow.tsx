import { useTransResolver } from "@/app/app.hooks"
import {
	AbookEntrySourceType,
	type AbookEntry,
	type WithId,
} from "@teawithsand/booklibr"
import styles from "./AbookEntryShow.module.scss"
import { AbookEntryHeroSection } from "./parts/AbookEntryHeroSection"
import { AbookEntryMetadataAside } from "./parts/AbookEntryMetadataAside"

interface AbookEntryShowProps {
	readonly entry: WithId<AbookEntry>
	readonly entryId: string
	readonly onBackClick?: () => void
}

/**
 * Component for displaying a single audiobook entry with detailed information.
 * Shows entry metadata, disposition, source information, and extracted data.
 */
export const AbookEntryShow = ({
	entry,
	entryId,
	onBackClick,
}: AbookEntryShowProps) => {
	const { resolve } = useTransResolver()

	const entryData = entry.data
	const fileName =
		entryData.data.source.type === AbookEntrySourceType.UPLOAD
			? entryData.data.source.uploadFileName
			: resolve((t) => t.abooks.preview.entryTitle(parseInt(entryId, 10)))

	return (
		<div className={styles.container}>
			<div className={styles.headerSection}>
				<div className={styles.headerContent}>
					<h1 className={styles.headerTitle}>
						{entryData.data.name || fileName}
					</h1>
					{onBackClick && (
						<button
							className={styles.backButton}
							onClick={onBackClick}
							type="button"
						>
							{resolve((t) => t.abooks.preview.backButton)}
						</button>
					)}
				</div>
			</div>

			<AbookEntryHeroSection entry={entry} />

			<div className={styles.contentGrid}>
				<AbookEntryMetadataAside entry={entry} />
			</div>
		</div>
	)
}
