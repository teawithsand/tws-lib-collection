import { useTransResolver } from "@/app/app.hooks"
import { IconEdit, IconTrash } from "@tabler/icons-react"
import type { Abook, AbookEntry, WithId } from "@teawithsand/booklibr"
import { ActionIcon, Group } from "@teawithsand/mlui"
import styles from "./AbookShow.module.scss"
import { AbookHeroSection } from "./show/AbookHeroSection"
import { AbookMetadataAside } from "./show/AbookMetadataAside"

interface AbookShowProps {
	readonly abook: Abook
	readonly abookEntries: Array<WithId<AbookEntry>>
	readonly abookId: string
	readonly onEditClick?: () => void
	readonly onDeleteClick?: () => void
}

export const AbookShow = ({
	abook,
	onEditClick,
	onDeleteClick,
}: AbookShowProps) => {
	const { resolve } = useTransResolver()

	return (
		<div>
			<div className={styles.headerSection}>
				<div className={styles.headerContent}>
					<h1 className={styles.headerTitle}>
						{abook.data.header.metadata.title}
					</h1>
					<Group gap="sm" className={styles.actionButtonsGroup}>
						<ActionIcon
							variant="filled"
							color="blue"
							size="xl"
							radius="md"
							className={styles.actionButton}
							onClick={onEditClick || (() => {})}
							disabled={!onEditClick}
							aria-label={resolve(
								(t) => t.abooks.preview.editButton,
							)}
						>
							<IconEdit size={20} />
						</ActionIcon>
						<ActionIcon
							variant="filled"
							color="red"
							size="xl"
							radius="md"
							className={styles.actionButton}
							onClick={onDeleteClick || (() => {})}
							disabled={!onDeleteClick}
							aria-label={resolve(
								(t) => t.abooks.preview.deleteButton,
							)}
						>
							<IconTrash size={20} />
						</ActionIcon>
					</Group>
				</div>
			</div>

			<AbookHeroSection abook={abook} />

			<div className={styles.contentGrid}>
				<AbookMetadataAside abook={abook} />
			</div>
		</div>
	)
}
