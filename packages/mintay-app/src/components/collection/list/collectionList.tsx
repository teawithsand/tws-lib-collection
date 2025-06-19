import { AppCollectionData } from "@/mintay"
import { WithMintayId } from "@/mintay/withId"
import { Routes } from "@/router/routes"
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
import { IconBook, IconEdit } from "@tabler/icons-react"
import { Link } from "react-router"
import styles from "./collectionList.module.scss"

interface CollectionListProps {
	readonly collections: WithMintayId<AppCollectionData>[]
}

/**
 * Component for displaying a list of collections in a responsive grid layout
 */
export const CollectionList = ({ collections }: CollectionListProps) => {
	return (
		<div className={styles.content}>
			<Grid className={styles.collectionsGrid}>
				{collections.map((collection) => {
					const { data, id } = collection
					return (
						<Grid.Col
							key={id}
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
									<Link
										to={Routes.collectionDetail.navigate(
											id.toString(),
										)}
										className={styles.titleLink}
									>
										<Title
											order={4}
											className={styles.collectionTitle}
											lineClamp={2}
										>
											{data.title ||
												"Untitled Collection"}
										</Title>
									</Link>

									<Text
										size="sm"
										c="dimmed"
										className={styles.collectionDescription}
										lineClamp={3}
									>
										{data.description ||
											"No description available"}
									</Text>

									<Group
										justify="space-between"
										className={styles.cardMeta}
									>
										<Text size="xs" c="dimmed">
											Created:{" "}
											{new Date(
												data.createdAt,
											).toLocaleDateString()}
										</Text>
										{data.updatedAt !== data.createdAt && (
											<Text size="xs" c="dimmed">
												Updated:{" "}
												{new Date(
													data.updatedAt,
												).toLocaleDateString()}
											</Text>
										)}
									</Group>
								</Stack>

								<Card.Section className={styles.cardActions}>
									<Group justify="flex-end" p="md">
										<ActionIcon
											component={Link}
											to={Routes.editCollection.navigate(
												id.toString(),
											)}
											variant="subtle"
											color="orange"
											size="sm"
											title="Edit collection"
										>
											<IconEdit size={16} />
										</ActionIcon>
										<ActionIcon
											component={Link}
											to={Routes.collectionDetail.navigate(
												id.toString(),
											)}
											variant="subtle"
											color="blue"
											size="sm"
											title="View collection details"
										>
											<IconBook size={16} />
										</ActionIcon>
									</Group>
								</Card.Section>
							</Card>
						</Grid.Col>
					)
				})}
			</Grid>
		</div>
	)
}
