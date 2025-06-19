import {
	ActionIcon,
	Badge,
	Button,
	Group,
	Paper,
	Stack,
	Text,
	Title,
} from "@mantine/core"
import { IconArrowLeft, IconPlus } from "@tabler/icons-react"
import { Atom, useAtomValue } from "@teawithsand/fstate"
import { Link } from "react-router"
import { useTransResolver } from "../../../app"
import { AppCardData, AppCollectionData, WithMintayId } from "../../../mintay"
import { Routes } from "../../../router/routes"
import { CardList } from "./CardList"

interface CollectionCardsListProps {
	readonly collectionAtom: Atom<Promise<WithMintayId<AppCollectionData>>>
	readonly cardsAtom: Atom<Promise<WithMintayId<AppCardData>[]>>
	readonly collectionId: string
}

/**
 * Component for displaying a collection's cards with header and actions
 * Combines collection info display with card listing functionality
 */
export const CollectionCardsList = ({
	collectionAtom,
	cardsAtom,
	collectionId,
}: CollectionCardsListProps) => {
	const { resolve } = useTransResolver()
	const collectionData = useAtomValue(collectionAtom)
	const cardsData = useAtomValue(cardsAtom)

	return (
		<Stack gap="lg">
			<Paper p="lg" radius="md" withBorder>
				<Group justify="space-between" align="flex-start">
					<div>
						<Group gap="md" align="center" mb="md">
							<ActionIcon
								component={Link}
								to={Routes.collectionDetail.navigate(
									collectionId,
								)}
								variant="light"
								size="lg"
								aria-label="Back to collection"
							>
								<IconArrowLeft size={18} />
							</ActionIcon>
							<div>
								<Title order={2}>Collection Cards</Title>
								<Text size="sm" c="dimmed">
									{collectionData.data.title}
								</Text>
							</div>
						</Group>

						<Group gap="md">
							<Badge variant="light" color="blue">
								ID: {collectionId}
							</Badge>
							{collectionData.data.description && (
								<Text size="sm" c="dimmed" lineClamp={2}>
									{collectionData.data.description}
								</Text>
							)}
						</Group>
					</div>

					<Button
						component={Link}
						to={Routes.createCollectionCard.navigate(collectionId)}
						leftSection={<IconPlus size={16} />}
						variant="filled"
					>
						{resolve((t) => t.card.form.createCard())}
					</Button>
				</Group>
			</Paper>

			<CardList cards={cardsData} collectionId={collectionId} />
		</Stack>
	)
}
