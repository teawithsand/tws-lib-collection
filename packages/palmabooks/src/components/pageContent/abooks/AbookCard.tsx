import { IconBook } from "@tabler/icons-react"
import type { Abook, WithId } from "@teawithsand/booklibr"
import { Card, Group, Stack, Text, Title } from "@teawithsand/mlui"

export interface AbookCardProps {
	abook: WithId<Abook>
	entryCountText: string
	durationText: string
	onClick?: (abook: WithId<Abook>) => void
}

/**
 * Card component for displaying individual audiobook information.
 */
export const AbookCard = ({
	abook,
	entryCountText,
	durationText,
	onClick,
}: AbookCardProps) => {
	const handleClick = () => {
		onClick?.(abook)
	}

	return (
		<Card
			padding="lg"
			radius="md"
			withBorder
			style={{ cursor: onClick ? "pointer" : "default" }}
			onClick={handleClick}
		>
			<Group align="flex-start" wrap="nowrap">
				<IconBook size={32} color="var(--mantine-color-blue-6)" />
				<Stack gap="xs" style={{ flex: 1 }}>
					<Title order={4}>
						{abook.data.data.header.metadata.title}
					</Title>
					<Text size="sm" c="dimmed">
						{abook.data.data.header.metadata.description}
					</Text>
					<Group gap="xs">
						<Text size="xs" c="dimmed">
							{entryCountText}
						</Text>
						<Text size="xs" c="dimmed">
							•
						</Text>
						<Text size="xs" c="dimmed">
							{durationText}
						</Text>
					</Group>
				</Stack>
			</Group>
		</Card>
	)
}
