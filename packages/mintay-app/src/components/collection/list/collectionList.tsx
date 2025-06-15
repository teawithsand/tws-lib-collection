import {
	ActionIcon,
	Alert,
	Badge,
	Button,
	Card,
	Container,
	Grid,
	Group,
	Loader,
	Stack,
	Text,
	Title,
} from "@mantine/core"
import { IconAlertCircle, IconBook, IconPlus } from "@tabler/icons-react"
import { useAtomValue } from "@teawithsand/fstate"
import { useApp } from "../../../app"
import styles from "./collectionList.module.scss"

/**
 * Component for displaying a list of all available collections in a responsive grid layout
 */
export const CollectionList = () => {
	const app = useApp()
	const collectionsLoadable = useAtomValue(
		app.collectionService.collectionDataListLoadable,
	)

	const handleRefresh = () => {
		// Trigger refresh of collections list
		app.atomStore.set(app.collectionService.refreshCollectionsList)
	}

	const renderContent = () => {
		if (collectionsLoadable.state === "loading") {
			return (
				<div className={styles.loadingContainer}>
					<Loader size="lg" />
					<Text mt="md" c="dimmed">
						Loading collections...
					</Text>
				</div>
			)
		}

		if (collectionsLoadable.state === "hasError") {
			return (
				<Alert
					icon={<IconAlertCircle size={16} />}
					title="Error loading collections"
					color="red"
					className={styles.errorAlert}
				>
					<Text size="sm">
						Failed to load collections. Please try refreshing.
					</Text>
					<Button
						variant="outline"
						size="xs"
						mt="sm"
						onClick={handleRefresh}
					>
						Retry
					</Button>
				</Alert>
			)
		}

		const collections = collectionsLoadable.data

		if (!collections || collections.length === 0) {
			return (
				<div className={styles.emptyState}>
					<IconBook size={48} className={styles.emptyIcon} />
					<Title order={3} className={styles.emptyTitle}>
						No collections yet
					</Title>
					<Text c="dimmed" className={styles.emptyDescription}>
						Create your first collection to get started with
						organizing your cards.
					</Text>
					<Button
						leftSection={<IconPlus size={16} />}
						variant="filled"
						size="md"
						mt="lg"
					>
						Create Collection
					</Button>
				</div>
			)
		}

		return (
			<Grid className={styles.collectionsGrid}>
				{collections.map((collection) => (
					<Grid.Col
						key={collection.globalId || "unknown"}
						span={{ base: 12, sm: 6, md: 4, lg: 3 }}
					>
						<Card
							shadow="sm"
							padding="lg"
							radius="md"
							withBorder
							className={styles.collectionCard}
						>
							<Card.Section className={styles.cardHeader}>
								<Group justify="space-between" p="md">
									<IconBook
										size={24}
										className={styles.collectionIcon}
									/>
									<Badge
										color="blue"
										variant="light"
										size="sm"
									>
										Collection
									</Badge>
								</Group>
							</Card.Section>

							<Stack gap="sm" className={styles.cardContent}>
								<Title
									order={4}
									className={styles.collectionTitle}
									lineClamp={2}
								>
									{collection.title || "Untitled Collection"}
								</Title>

								<Text
									size="sm"
									c="dimmed"
									className={styles.collectionDescription}
									lineClamp={3}
								>
									{collection.description ||
										"No description available"}
								</Text>

								<Group
									justify="space-between"
									className={styles.cardMeta}
								>
									<Text size="xs" c="dimmed">
										Created:{" "}
										{new Date(
											collection.createdAtTimestamp,
										).toLocaleDateString()}
									</Text>
									{collection.lastUpdatedAtTimestamp !==
										collection.createdAtTimestamp && (
										<Text size="xs" c="dimmed">
											Updated:{" "}
											{new Date(
												collection.lastUpdatedAtTimestamp,
											).toLocaleDateString()}
										</Text>
									)}
								</Group>
							</Stack>

							<Card.Section className={styles.cardActions}>
								<Group justify="flex-end" p="md">
									<ActionIcon
										variant="subtle"
										color="blue"
										size="sm"
									>
										<IconBook size={16} />
									</ActionIcon>
								</Group>
							</Card.Section>
						</Card>
					</Grid.Col>
				))}
			</Grid>
		)
	}

	return (
		<Container size="xl" className={styles.container}>
			<div className={styles.header}>
				<Group justify="space-between" align="center">
					<div>
						<Title order={1} className={styles.pageTitle}>
							Collections
						</Title>
						<Text c="dimmed" className={styles.pageSubtitle}>
							Manage your card collections
						</Text>
					</div>
					<Group>
						<Button
							variant="subtle"
							onClick={handleRefresh}
							loading={collectionsLoadable.state === "loading"}
						>
							Refresh
						</Button>
						<Button
							leftSection={<IconPlus size={16} />}
							variant="filled"
						>
							New Collection
						</Button>
					</Group>
				</Group>
			</div>

			<div className={styles.content}>{renderContent()}</div>
		</Container>
	)
}
