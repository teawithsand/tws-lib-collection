import { useTransResolver } from "@/app/app.hooks"
import { Routes } from "@/router/routes"
import { IconPlus } from "@tabler/icons-react"
import { Button, Group, Link, Text, Title } from "@teawithsand/mlui"

export interface AbookListPageHeaderProps {
	abooksCount: number
}

/**
 * Header component for the audiobooks page with title, subtitle, and add button.
 */
export const AbookListPageHeader = ({
	abooksCount,
}: AbookListPageHeaderProps) => {
	const { resolve } = useTransResolver()

	const title = resolve((t) => t.abooks.pageTitle)
	const addButtonLabel = resolve((t) => t.abooks.list.addButton)
	const addButtonTo = Routes.addBook.navigate()

	const subtitle = resolve((t) => t.abooks.list.countText(abooksCount))

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
