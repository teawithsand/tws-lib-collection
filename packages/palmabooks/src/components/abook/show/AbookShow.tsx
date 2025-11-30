import { useTransResolver } from "@/app/app.hooks"
import { Abook, WithId } from "@teawithsand/booklibr"
import { Stack, Text, Title } from "@teawithsand/mlui"
import styles from "./abookShow.module.scss"
import {
	AbookAddFilesActionCard,
	AbookDeleteActionCard,
	AbookDurationCard,
	AbookEditActionCard,
	AbookEntriesCard,
	AbookPreviewActionCard,
	AbookProgressCard,
} from "./parts"

export interface AbookShowProps {
	readonly abook: WithId<Abook>
	readonly onDelete?: () => void
	readonly onEdit?: () => void
	readonly onPreview?: () => void
	readonly onAddFiles?: () => void
}

/**
 * Component for displaying detailed audiobook preview information.
 * Shows metadata, statistics, and notes in a structured layout.
 * This is a minimal preview component that doesn't perform any operations.
 */
export const AbookShow = ({
	abook,
	onDelete,
	onEdit,
	onPreview,
	onAddFiles,
}: AbookShowProps) => {
	const { resolve } = useTransResolver()

	return (
		<Stack gap="lg">
			<Title order={1}>{resolve((t) => t.abook.preview.title)}</Title>

			<Stack align="center">
				<Title order={2}>{abook.data.data.header.metadata.title}</Title>
				<Text>{abook.data.data.header.metadata.description}</Text>
			</Stack>

			<Text size="lg">Summary</Text>

			<div className={styles.statsGrid}>
				<AbookDurationCard abook={abook} />
				<AbookEntriesCard abook={abook} />
				<AbookProgressCard abook={abook} />
			</div>

			<Text size="lg">Actions</Text>

			<div className={styles.actionsGrid}>
				<AbookDeleteActionCard abook={abook} onDelete={onDelete} />
				<AbookEditActionCard abook={abook} onEdit={onEdit} />
				<AbookPreviewActionCard abook={abook} onPreview={onPreview} />
				<AbookAddFilesActionCard
					abook={abook}
					onAddFiles={onAddFiles}
				/>
			</div>
		</Stack>
	)
}
