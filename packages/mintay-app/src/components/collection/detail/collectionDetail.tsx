import { AppCardData, AppCollectionData, WithMintayId } from "@/mintay"
import { Routes } from "@/router/routes"
import {
	ActionIcon,
	Badge,
	Button,
	Card,
	Divider,
	Group,
	Stack,
	Text,
	Title,
} from "@mantine/core"
import { IconBook, IconCards, IconEdit, IconPlus } from "@tabler/icons-react"
import { Atom, useAtomValue } from "@teawithsand/fstate"
import { Link } from "react-router"
import { useTransResolver } from "../../../app"
import { AutonomousCardList } from "../../card"
import styles from "./collectionDetail.module.scss"

interface CollectionDetailProps {
	readonly collectionAtom: Atom<Promise<WithMintayId<AppCollectionData>>>
	readonly cardCountAtom: Atom<Promise<number>>
	readonly cardsAtom: Atom<Promise<WithMintayId<AppCardData>[]>>
}

/**
 * Component for displaying detailed information about a single collection
 */
export const CollectionDetail = ({
	collectionAtom,
	cardCountAtom,
	cardsAtom,
}: CollectionDetailProps) => {
	const { resolve } = useTransResolver()
	const collectionData = useAtomValue(collectionAtom)
	const cardCount = useAtomValue(cardCountAtom)

	const { data: collection, id } = collectionData

	const formattedCreatedAt = new Date(
		collection.createdAt,
	).toLocaleDateString()
	const formattedUpdatedAt = new Date(
		collection.updatedAt,
	).toLocaleDateString()

	return (
		<div className={styles.container}>
			<Card shadow="sm" padding="lg" radius="md" withBorder>
				<Stack gap="md">
					<Group justify="space-between" align="flex-start">
						<div>
							<Title order={2} className={styles.title}>
								{collection.title}
							</Title>
							<Text
								size="sm"
								c="dimmed"
								className={styles.globalId}
							>
								ID: {collection.globalId}
							</Text>
						</div>
						<ActionIcon
							component={Link}
							to={Routes.editCollection.navigate(id.toString())}
							variant="light"
							size="lg"
							aria-label="Edit collection"
						>
							<IconEdit size={18} />
						</ActionIcon>
					</Group>

					<div>
						<Text fw={500} size="sm" mb="xs">
							Description
						</Text>
						<Text size="sm" className={styles.description}>
							{collection.description ||
								"No description provided"}
						</Text>
					</div>

					<Group>
						<Badge
							leftSection={<IconBook size={12} />}
							variant="light"
							color="blue"
						>
							Collection
						</Badge>
					</Group>

					<Group gap="xl">
						<div>
							<Text
								size="xs"
								c="dimmed"
								tt="uppercase"
								fw={700}
								mb="xs"
							>
								Cards
							</Text>
							<Text size="sm">{cardCount}</Text>
						</div>
						<div>
							<Text
								size="xs"
								c="dimmed"
								tt="uppercase"
								fw={700}
								mb="xs"
							>
								Created
							</Text>
							<Text size="sm">{formattedCreatedAt}</Text>
						</div>
						<div>
							<Text
								size="xs"
								c="dimmed"
								tt="uppercase"
								fw={700}
								mb="xs"
							>
								Last Updated
							</Text>
							<Text size="sm">{formattedUpdatedAt}</Text>
						</div>
					</Group>

					<Divider />

					<div>
						<Group justify="space-between" align="center" mb="md">
							<Group gap="xs">
								<IconCards size={20} />
								<Title order={3}>Cards</Title>
							</Group>
							<Group gap="sm">
								<Button
									component={Link}
									to={Routes.createCollectionCard.navigate(
										id.toString(),
									)}
									leftSection={<IconPlus size={16} />}
									variant="light"
									size="sm"
								>
									{resolve((t) => t.card.form.createCard())}
								</Button>
								<ActionIcon
									component={Link}
									to={Routes.collectionCards.navigate(
										id.toString(),
									)}
									variant="light"
									size="sm"
									aria-label="View all cards"
								>
									<IconCards size={16} />
								</ActionIcon>
							</Group>
						</Group>
						<AutonomousCardList
							cardsAtom={cardsAtom}
							collectionId={id.toString()}
						/>
					</div>
				</Stack>
			</Card>
		</div>
	)
}
