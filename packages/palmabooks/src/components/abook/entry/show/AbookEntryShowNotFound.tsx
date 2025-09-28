import { useTransResolver } from "@/app/app.hooks"
import { Text } from "@teawithsand/mlui"
import styles from "./AbookEntryShowNotFound.module.scss"

interface AbookEntryShowNotFoundProps {
	readonly onBackClick?: () => void
}

/**
 * Component displayed when an audiobook entry is not found.
 */
export const AbookEntryShowNotFound = ({
	onBackClick,
}: AbookEntryShowNotFoundProps) => {
	const { resolve } = useTransResolver()

	return (
		<div className={styles.container}>
			<div className={styles.content}>
				<h1 className={styles.title}>
					{resolve((t) => t.abooks.entry.notFound.title)}
				</h1>
				<Text className={styles.description}>
					{resolve((t) => t.abooks.entry.notFound.description)}
				</Text>
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
	)
}
