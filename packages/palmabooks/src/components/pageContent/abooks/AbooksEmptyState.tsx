import { IconBook, IconPlus } from "@tabler/icons-react"
import { Button, Card, Link, Stack, Text, Title } from "@teawithsand/mlui"

export interface AbooksEmptyStateProps {
	title: string
	description: string
	createButtonLabel: string
	createButtonTo: string
}

/**
 * Empty state component for when no audiobooks are available.
 */
export const AbooksEmptyState = ({
	title,
	description,
	createButtonLabel,
	createButtonTo,
}: AbooksEmptyStateProps) => {
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
