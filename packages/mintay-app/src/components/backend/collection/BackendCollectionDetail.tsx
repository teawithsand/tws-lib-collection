import { useApp } from "@/app"
import {
	ActionIcon,
	Badge,
	Button,
	Card,
	Group,
	Loader,
	Text,
	Title,
} from "@mantine/core"
import {
	IconDownload,
	IconFileText,
	IconRefresh,
	IconServer,
} from "@tabler/icons-react"
import { useAtomValue, useSetAtom } from "@teawithsand/fstate"
import { useEffect } from "react"
import { useParams } from "react-router"
import {
	CollectionDownloadModal,
	useCollectionDownloadModal,
} from "../../backend/download"
import styles from "./BackendCollection.module.scss"

/**
 * Component for displaying details of a single backend collection
 */
export const BackendCollectionDetail = () => {
	const { id } = useParams<{ id: string }>()
	const app = useApp()
	const selectedCollectionLoadable = useAtomValue(
		app.backendService.selectedCollectionLoadable,
	)
	const fetchCollection = useSetAtom(app.backendService.fetchCollection)
	const downloadModalState = useCollectionDownloadModal()

	useEffect(() => {
		if (id) {
			fetchCollection(id)
		}
	}, [id, fetchCollection])

	if (!id) {
		return (
			<div className={styles["backend-collection-detail__error"]}>
				<IconServer
					size={48}
					className={styles["backend-collection-detail__error-icon"]}
				/>
				<Title order={3} size="h4" mb="sm">
					Invalid Collection ID
				</Title>
				<Text size="sm" c="dimmed" mb="md">
					No collection ID provided in the URL.
				</Text>
			</div>
		)
	}

	if (selectedCollectionLoadable.state === "loading") {
		return (
			<div className={styles["backend-collection-detail__loading"]}>
				<Loader size="xl" />
				<Text size="sm" c="dimmed" mt="md">
					Loading collection details...
				</Text>
			</div>
		)
	}

	if (selectedCollectionLoadable.state === "hasError") {
		return (
			<div className={styles["backend-collection-detail__error"]}>
				<IconServer
					size={48}
					className={styles["backend-collection-detail__error-icon"]}
				/>
				<Title order={3} size="h4" mb="sm">
					Error loading collection
				</Title>
				<Text size="sm" c="dimmed" mb="md">
					Failed to load collection from server
				</Text>
				<Group gap="sm" justify="center">
					<ActionIcon
						onClick={() => fetchCollection(id)}
						size="lg"
						variant="filled"
						aria-label="Retry loading collection"
					>
						<IconRefresh size={20} />
					</ActionIcon>
				</Group>
			</div>
		)
	}

	const collection = selectedCollectionLoadable.data

	if (!collection) {
		return (
			<div className={styles["backend-collection-detail__error"]}>
				<IconServer
					size={48}
					className={styles["backend-collection-detail__error-icon"]}
				/>
				<Title order={3} size="h4" mb="sm">
					Collection not found
				</Title>
				<Text size="sm" c="dimmed" mb="md">
					The requested collection could not be found.
				</Text>
			</div>
		)
	}

	return (
		<div className={styles["backend-collection-detail__container"]}>
			<div className={styles["backend-collection-detail__header"]}>
				<div
					className={
						styles["backend-collection-detail__download-wrapper"]
					}
				>
					<Button
						leftSection={<IconDownload size={16} />}
						variant="filled"
						size="sm"
						onClick={() => downloadModalState.openModal(collection)}
						className={
							styles["backend-collection-detail__download-button"]
						}
					>
						Download Collection
					</Button>
				</div>

				<Title order={1} size="h2" mb="xs">
					{collection.collection.title}
				</Title>

				{collection.collection.description && (
					<Text size="lg" c="dimmed" mb="md">
						{collection.collection.description}
					</Text>
				)}

				<Group gap="md" mb="xl">
					<Badge variant="light" color="gray" size="md">
						ID: {collection.collection.globalId}
					</Badge>
					<Badge variant="light" color="blue" size="md">
						{collection.cards.length} card
						{collection.cards.length !== 1 ? "s" : ""}
					</Badge>
				</Group>
			</div>

			<div className={styles["backend-collection-detail__cards"]}>
				<Title order={2} size="h3" mb="md">
					Cards
				</Title>

				{collection.cards.length === 0 ? (
					<div
						className={
							styles["backend-collection-detail__empty-state"]
						}
					>
						<IconFileText
							size={48}
							className={
								styles[
									"backend-collection-detail__empty-state-icon"
								]
							}
						/>
						<Title
							order={3}
							size="h4"
							className={
								styles[
									"backend-collection-detail__empty-state-title"
								]
							}
						>
							No cards found
						</Title>
						<Text size="sm" c="dimmed">
							This collection has no cards.
						</Text>
					</div>
				) : (
					<div
						className={
							styles["backend-collection-detail__cards-grid"]
						}
					>
						{collection.cards.map((card, index) => (
							<Card
								key={card.globalId}
								className={
									styles["backend-collection-detail__card"]
								}
								shadow="sm"
								padding="lg"
								radius="md"
								withBorder
							>
								<div
									className={
										styles[
											"backend-collection-detail__card-header"
										]
									}
								>
									<Title order={4} size="h5" mb="xs">
										Card {index + 1}
									</Title>
									<Text size="xs" c="dimmed">
										ID: {card.globalId}
									</Text>
								</div>

								<div
									className={
										styles[
											"backend-collection-detail__card-content"
										]
									}
								>
									<div
										className={
											styles[
												"backend-collection-detail__card-section"
											]
										}
									>
										<Text
											fw={600}
											size="sm"
											mb="xs"
											c="blue"
										>
											Question:
										</Text>
										<Card
											className={
												styles[
													"backend-collection-detail__card-text"
												]
											}
											padding="sm"
											withBorder
										>
											<Text size="sm">
												{card.questionContent}
											</Text>
										</Card>
									</div>

									<div
										className={
											styles[
												"backend-collection-detail__card-section"
											]
										}
									>
										<Text
											fw={600}
											size="sm"
											mb="xs"
											c="green"
										>
											Answer:
										</Text>
										<Card
											className={
												styles[
													"backend-collection-detail__card-text"
												]
											}
											padding="sm"
											withBorder
										>
											<Text size="sm">
												{card.answerContent}
											</Text>
										</Card>
									</div>
								</div>
							</Card>
						))}
					</div>
				)}
			</div>

			<CollectionDownloadModal
				opened={downloadModalState.opened}
				onClose={downloadModalState.closeModal}
				backendCollectionData={downloadModalState.backendCollectionData}
			/>
		</div>
	)
}
