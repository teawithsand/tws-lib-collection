import { useTransResolver } from "@/app/app.hooks"
import { Button, Card, Group, Stack, Text, Title } from "@teawithsand/mlui"

interface StorageActionsSectionProps {
	readonly onRefreshStorage: () => void
}

/**
 * Storage actions section component that provides storage management actions.
 */
export const StorageActionsSection = ({
	onRefreshStorage,
}: StorageActionsSectionProps) => {
	const { resolve } = useTransResolver()

	return (
		<Card padding="lg" shadow="sm" withBorder>
			<Stack gap="md">
				<Title order={2}>
					{resolve((t) => t.storage.actions.title)}
				</Title>

				<Group>
					<Button variant="light" onClick={onRefreshStorage}>
						{resolve((t) => t.storage.actions.refreshButton)}
					</Button>
				</Group>

				<Text size="sm" c="dimmed">
					{resolve((t) => t.storage.actions.refreshDescription)}
				</Text>
			</Stack>
		</Card>
	)
}
