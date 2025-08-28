import { useTransResolver } from "@/app/app.hooks"
import {
	AutonomousAbookDeleteModal,
	useAbookDeleteModal,
} from "@/components/abook/modal/delete"
import { Routes } from "@/router"
import { IconTrash } from "@tabler/icons-react"
import type { Abook, AbookEntry, WithId } from "@teawithsand/booklibr"
import { Button, Link, Stack, Text } from "@teawithsand/mlui"
import styles from "./AbookShow.module.scss"

interface AbookPreviewPageContentProps {
	readonly abook: Abook
	readonly abookEntries: Array<WithId<AbookEntry>>
	readonly abookId: string
}

export const AbookShow = ({
	abook,
	abookEntries,
	abookId,
}: AbookPreviewPageContentProps) => {
	const { resolve } = useTransResolver()
	const deleteModal = useAbookDeleteModal()

	const formatDuration = (milliseconds: number): string => {
		return resolve((t) => t.util.time.formatDuration(milliseconds))
	}

	const formatDate = (timestamp: number): string => {
		return resolve((t) => t.util.time.formatDate(timestamp))
	}

	return (
		<>
			<div className={styles.container}>
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
									{resolve(
										(t) => t.abooks.preview.entryCount,
									)}
								</Text>
							</div>
						</div>
					</div>
				</div>

				<div className={styles.contentGrid}>
					<div className={styles.entriesSection}>
						<Text className={styles.sectionTitle}>
							{resolve((t) => t.abooks.preview.entries)}
						</Text>

						{abookEntries.length === 0 ? (
							<div className={styles.emptyState}>
								<div className={styles.emptyIcon}>📚</div>
								<Text c="dimmed" size="lg">
									{resolve((t) => t.abooks.preview.noEntries)}
								</Text>
							</div>
						) : (
							<Stack gap="md">
								{abookEntries.map(
									(
										entry: WithId<AbookEntry>,
										index: number,
									) => {
										const hasAudioMetadata =
											entry.data.aggregate.metadata
												?.metadata.audio.type ===
											"success"
										const audioDuration =
											hasAudioMetadata &&
											entry.data.aggregate.metadata
												?.metadata.audio.type ===
												"success"
												? (
														entry.data.aggregate
															.metadata.metadata
															.audio as {
															metadata: {
																duration: number
															}
														}
													).metadata.duration
												: 0

										return (
											<div
												key={entry.id}
												className={styles.entryCard}
											>
												<div
													className={
														styles.entryContent
													}
												>
													<Text
														className={
															styles.entryTitle
														}
													>
														{resolve((t) =>
															t.abooks.preview.entryTitle(
																index,
															),
														)}
													</Text>

													<div
														className={
															styles.entryDetails
														}
													>
														<div
															className={
																styles.entryDetail
															}
														>
															<strong>
																{resolve(
																	(t) =>
																		t.abooks
																			.preview
																			.sourceLabel,
																)}
																:
															</strong>
															<span>
																{
																	entry.data
																		.data
																		.source
																		.type
																}
															</span>
														</div>

														<div
															className={
																styles.entryDetail
															}
														>
															<strong>
																{resolve(
																	(t) =>
																		t.abooks
																			.preview
																			.durationLabel,
																)}
																:
															</strong>
															<span>
																{audioDuration >
																0
																	? formatDuration(
																			audioDuration *
																				1000,
																		)
																	: resolve(
																			(
																				t,
																			) =>
																				t
																					.common
																					.unknown,
																		)}
															</span>
														</div>

														<div
															className={
																styles.entryDetail
															}
														>
															<strong>
																{resolve(
																	(t) =>
																		t.abooks
																			.preview
																			.dispositionLabel,
																)}
																:
															</strong>
															<span>
																{
																	entry.data
																		.data
																		.disposition
																}
															</span>
														</div>
													</div>
												</div>
											</div>
										)
									},
								)}
							</Stack>
						)}
					</div>

					<div className={styles.metadataAside}>
						<div className={styles.metadataCard}>
							<Text className={styles.metadataTitle}>
								{resolve((t) => t.abooks.preview.metadata)}
							</Text>

							<div className={styles.metadataItem}>
								<Text className={styles.metadataLabel}>
									{resolve(
										(t) => t.abooks.preview.createdLabel,
									)}
								</Text>
								<Text className={styles.metadataValue}>
									{formatDate(
										Number(abook.data.header.createdAt),
									)}
								</Text>
							</div>

							<div className={styles.metadataItem}>
								<Text className={styles.metadataLabel}>
									{resolve(
										(t) =>
											t.abooks.preview.totalDurationLabel,
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
									{resolve(
										(t) => t.abooks.preview.entriesLabel,
									)}
								</Text>
								<Text className={styles.metadataValue}>
									{abook.aggregate.totalEntries}
								</Text>
							</div>
						</div>

						<div className={styles.actionButtons}>
							<Link to={Routes.editBook.navigate(abookId)}>
								<Button className={styles.editButton} size="lg">
									{resolve(
										(t) => t.abooks.preview.editButton,
									)}
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
