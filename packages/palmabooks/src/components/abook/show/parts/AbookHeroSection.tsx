import { useTransResolver } from "@/app/app.hooks"
import type { Abook } from "@teawithsand/booklibr"
import { Text } from "@teawithsand/mlui"
import styles from "./AbookHeroSection.module.scss"

interface AbookHeroSectionProps {
	readonly abook: Abook
}

export const AbookHeroSection = ({ abook }: AbookHeroSectionProps) => {
	const { resolve } = useTransResolver()

	const formatDuration = (milliseconds: number): string => {
		return resolve((t) => t.util.time.formatDuration(milliseconds))
	}

	return (
		<div className={styles.heroSection}>
			<div className={styles.heroContent}>
				{abook.data.header.metadata.description && (
					<Text className={styles.subtitle}>
						{abook.data.header.metadata.description}
					</Text>
				)}

				<div className={styles.statsRow}>
					<div className={styles.statItem}>
						<span className={styles.statValue}>
							{formatDuration(
								abook.aggregate.totalDurationMillis,
							)}
						</span>
						<Text className={styles.statLabel}>
							{resolve((t) => t.abooks.preview.duration)}
						</Text>
					</div>

					<div className={styles.statItem}>
						<span className={styles.statValue}>
							{abook.aggregate.totalEntries}
						</span>
						<Text className={styles.statLabel}>
							{resolve((t) => t.abooks.preview.entryCount)}
						</Text>
					</div>
				</div>
			</div>
		</div>
	)
}
