import { useTransResolver } from "@/app/app.hooks"
import {
	AutonomousAbookDeleteModal,
	useAbookDeleteModal,
} from "@/components/abook/modal/delete"
import { Routes } from "@/router"
import { IconTrash } from "@tabler/icons-react"
import type { Abook } from "@teawithsand/booklibr"
import { Button, Link, Text } from "@teawithsand/mlui"
import styles from "../AbookShow.module.scss"

interface AbookMetadataAsideProps {
	readonly abook: Abook
	readonly abookId: string
	readonly formatDuration: (milliseconds: number) => string
	readonly formatDate: (timestamp: number) => string
}

export const AbookMetadataAside = ({
	abook,
	abookId,
	formatDuration,
	formatDate,
}: AbookMetadataAsideProps) => {
	const { resolve } = useTransResolver()
	const deleteModal = useAbookDeleteModal()

	return (
		<>
			<div className={styles.metadataAside}>
				<div className={styles.metadataCard}>
					<Text className={styles.metadataTitle}>
						{resolve((t) => t.abooks.preview.metadata)}
					</Text>

					<div className={styles.metadataItem}>
						<Text className={styles.metadataLabel}>
							{resolve((t) => t.abooks.preview.createdLabel)}
						</Text>
						<Text className={styles.metadataValue}>
							{formatDate(Number(abook.data.header.createdAt))}
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

				<div className={styles.actionButtons}>
					<Link to={Routes.editBook.navigate(abookId)}>
						<Button className={styles.editButton} size="lg">
							{resolve((t) => t.abooks.preview.editButton)}
						</Button>
					</Link>

					<Button
						color="red"
						size="lg"
						leftSection={<IconTrash size={18} />}
						onClick={() =>
							deleteModal.openModal(
								abookId,
								abook.data.header.metadata.title,
							)
						}
					>
						{resolve((t) => t.abooks.preview.deleteButton)}
					</Button>
				</div>
			</div>

			<AutonomousAbookDeleteModal
				opened={deleteModal.opened}
				onClose={deleteModal.closeModal}
				abookId={deleteModal.abookId}
				abookTitle={deleteModal.abookTitle}
			/>
		</>
	)
}
