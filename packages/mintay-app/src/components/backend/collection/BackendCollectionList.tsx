import { useApp } from "@/app"
import {
	ActionIcon,
	Badge,
	Card,
	Group,
	Loader,
	Text,
	Title,
} from "@mantine/core"
import { IconEye, IconRefresh, IconServer } from "@tabler/icons-react"
import { useAtomValue, useSetAtom } from "@teawithsand/fstate"
import { useEffect } from "react"
import { Link } from "react-router"
import { BackendCollectionData } from "../../../domain/backend"
import { Routes } from "../../../router/routes"
import styles from "./BackendCollection.module.scss"

/**
 * Component for displaying a list of backend collections
 */
export const BackendCollectionList = () => {
	const app = useApp()
	const collectionsLoadable = useAtomValue(
		app.backendService.collectionsLoadable,
	)
	const fetchCollections = useSetAtom(app.backendService.fetchCollections)

	useEffect(() => {
		fetchCollections()
	}, [fetchCollections])

	if (collectionsLoadable.state === "loading") {
		return (
			<div className={styles["backend-collection-list__loading"]}>
				<Loader size="xl" />
				<Text size="sm" c="dimmed" mt="md">
					Loading collections from server...
				</Text>
			</div>
		)
	}

	if (collectionsLoadable.state === "hasError") {
		return (
			<div className={styles["backend-collection-list__error"]}>
				<IconServer
					size={48}
					className={styles["backend-collection-list__error-icon"]}
				/>
				<Title order={3} size="h4" mb="sm">
					Error loading collections
				</Title>
				<Text size="sm" c="dimmed" mb="md">
					Failed to load collections from server
				</Text>
				<ActionIcon
					onClick={() => fetchCollections()}
					size="lg"
					variant="filled"
					aria-label="Retry loading collections"
				>
					<IconRefresh size={20} />
				</ActionIcon>
			</div>
		)
	}

	const collections = collectionsLoadable.data

	if (!collections || collections.length === 0) {
		return (
			<div className={styles["backend-collection-list__empty-state"]}>
				<IconServer
					size={48}
					className={
						styles["backend-collection-list__empty-state-icon"]
					}
				/>
				<Title
					order={3}
					size="h4"
					className={
						styles["backend-collection-list__empty-state-title"]
					}
				>
					No collections found
				</Title>
				<Text size="sm" c="dimmed">
					There are no collections available on the server.
				</Text>
			</div>
		)
	}

	return (
		<div className={styles["backend-collection-list__container"]}>
			<div className={styles["backend-collection-list__header"]}>
				<Title order={1} size="h2" mb="xs">
					Backend Collections
				</Title>
				<Text size="sm" c="dimmed" mb="lg">
					{collections.length} collection
					{collections.length !== 1 ? "s" : ""} found
				</Text>
			</div>
			<div className={styles["backend-collection-list__grid"]}>
				{collections.map((collection: BackendCollectionData) => (
					<Card
						key={collection.collection.globalId}
						className={styles["backend-collection-list__card-item"]}
						shadow="sm"
						padding="lg"
						radius="md"
						withBorder
					>
						<div
							className={
								styles["backend-collection-list__card-header"]
							}
						>
							<div>
								<Text
									className={
										styles[
											"backend-collection-list__card-title"
										]
									}
									fw={600}
									size="md"
									mb="xs"
								>
									<Link
										to={Routes.backendCollectionDetail.navigate(
											collection.collection.globalId,
										)}
										className={
											styles[
												"backend-collection-list__card-link"
											]
										}
									>
										{collection.collection.title}
									</Link>
								</Text>
								<Text size="xs" c="dimmed">
									ID: {collection.collection.globalId}
								</Text>
							</div>
							<ActionIcon
								component={Link}
								to={Routes.backendCollectionDetail.navigate(
									collection.collection.globalId,
								)}
								variant="light"
								size="sm"
								aria-label="View collection details"
							>
								<IconEye size={16} />
							</ActionIcon>
						</div>

						{collection.collection.description && (
							<div
								className={
									styles[
										"backend-collection-list__card-content"
									]
								}
							>
								<Text
									size="sm"
									c="dimmed"
									className={
										styles[
											"backend-collection-list__card-description"
										]
									}
								>
									{collection.collection.description}
								</Text>
							</div>
						)}

						<div
							className={
								styles["backend-collection-list__card-footer"]
							}
						>
							<Group gap="xs">
								<Badge variant="light" color="blue" size="sm">
									{collection.cards.length} card
									{collection.cards.length !== 1 ? "s" : ""}
								</Badge>
							</Group>
						</div>
					</Card>
				))}
			</div>
		</div>
	)
}
