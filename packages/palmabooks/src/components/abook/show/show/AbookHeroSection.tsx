import { useTransResolver } from "@/app/app.hooks"
import type { Abook } from "@teawithsand/booklibr"
import { Text } from "@teawithsand/mlui"
import styles from "../AbookShow.module.scss"

interface AbookHeroSectionProps {
	readonly abook: Abook
	readonly formatDuration: (milliseconds: number) => string
}

export const AbookHeroSection = ({
	abook,
	formatDuration,
}: AbookHeroSectionProps) => {
	const { resolve } = useTransResolver()

	return (
		<div className={styles.heroSection}>
			<div className={styles.heroContent}>
				<Text className={styles.title}>
					{abook.data.header.metadata.title}
				</Text>

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
