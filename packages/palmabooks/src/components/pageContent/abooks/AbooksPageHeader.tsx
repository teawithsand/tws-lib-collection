import { IconPlus } from "@tabler/icons-react"
import { Button, Group, Link, Text, Title } from "@teawithsand/mlui"

export interface AbooksPageHeaderProps {
	title: string
	subtitle: string
	addButtonLabel: string
	addButtonTo: string
}

/**
 * Header component for the audiobooks page with title, subtitle, and add button.
 */
export const AbooksPageHeader = ({
	title,
	subtitle,
	addButtonLabel,
	addButtonTo,
}: AbooksPageHeaderProps) => {
	return (
		<Group justify="space-between">
			<div>
				<Title order={1}>{title}</Title>
				<Text mt="xs" c="dimmed">
					{subtitle}
				</Text>
			</div>
			<Button
				leftSection={<IconPlus size={16} />}
				variant="filled"
				component={Link}
				to={addButtonTo}
			>
				{addButtonLabel}
			</Button>
		</Group>
	)
}
