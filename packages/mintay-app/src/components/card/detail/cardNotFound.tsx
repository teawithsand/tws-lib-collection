import { Routes } from "@/router/routes"
import { Button, Container, Stack, Text, Title } from "@mantine/core"
import { IconCards } from "@tabler/icons-react"
import { Link } from "react-router"

interface CardDetailNotFoundProps {
	readonly collectionId?: string
}

/**
 * Component displayed when a requested card is not found
 */
export const CardDetailNotFound = ({
	collectionId,
}: CardDetailNotFoundProps) => {
	return (
		<Container size="sm" py="xl">
			<Stack align="center" gap="lg">
				<IconCards size={64} color="gray" />
				<Title order={2} ta="center">
					Card Not Found
				</Title>
				<Text size="lg" ta="center" c="dimmed">
					The card you're looking for doesn't exist or may have been
					deleted.
				</Text>
				<Stack gap="sm" align="center">
					{collectionId && (
						<Button
							component={Link}
							to={Routes.collectionCards.navigate(collectionId)}
							variant="filled"
						>
							View Collection Cards
						</Button>
					)}
					<Button
						component={Link}
						to={Routes.collections.navigate()}
						variant="light"
					>
						Back to Collections
					</Button>
				</Stack>
			</Stack>
		</Container>
	)
}
