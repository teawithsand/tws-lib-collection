import {
	ActionIcon,
	Badge,
	Card,
	Grid,
	Group,
	Stack,
	Text,
	Title,
} from "@mantine/core"
import { IconBook } from "@tabler/icons-react"
import { MintayCollectionData } from "@teawithsand/mintay-core"
import styles from "./collectionList.module.scss"

interface CollectionListProps {
	readonly collections: MintayCollectionData[]
}

/**
 * Component for displaying a list of collections in a responsive grid layout
 */
export const CollectionList = ({ collections }: CollectionListProps) => {
	return (
		<div className={styles.content}>
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
		</div>
	)
}
