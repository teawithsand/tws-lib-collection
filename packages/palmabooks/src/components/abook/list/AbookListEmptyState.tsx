import { useTransResolver } from "@/app/app.hooks"
import { Routes } from "@/router/routes"
import { IconBook, IconPlus } from "@tabler/icons-react"
import { Button, Card, Link, Stack, Text, Title } from "@teawithsand/mlui"

/**
 * Empty state component for when no audiobooks are available.
 */
export const AbookListEmptyState = () => {
	const { resolve } = useTransResolver()

	const title = resolve((t) => t.abooks.list.emptyState.title)
	const description = resolve((t) => t.abooks.list.emptyState.description)
	const createButtonLabel = resolve(
		(t) => t.abooks.list.emptyState.createButton,
	)
	const createButtonTo = Routes.addBook.navigate()

	return (
		<Card padding="xl" radius="md" withBorder>
			<Stack align="center" gap="lg">
				<IconBook size={48} color="var(--mantine-color-gray-5)" />
				<Title order={3} c="dimmed">
					{title}
				</Title>
				<Text c="dimmed" ta="center">
					{description}
				</Text>
				<Button
					leftSection={<IconPlus size={16} />}
					variant="filled"
					size="md"
					component={Link}
					to={createButtonTo}
				>
					{createButtonLabel}
				</Button>
			</Stack>
		</Card>
	)
}
