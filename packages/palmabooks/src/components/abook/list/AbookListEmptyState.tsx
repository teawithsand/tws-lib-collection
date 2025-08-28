import { useTransResolver } from "@/app/app.hooks"
import { Routes } from "@/router/routes"
import { IconBook, IconPlus } from "@tabler/icons-react"
import { Button, Card, Link, Stack, Text, Title } from "@teawithsand/mlui"
import styles from "./AbookListEmptyState.module.scss"

export const AbookListEmptyState = () => {
	const { resolve } = useTransResolver()

	const title = resolve((t) => t.abooks.list.emptyState.title)
	const description = resolve((t) => t.abooks.list.emptyState.description)
	const createButtonLabel = resolve(
		(t) => t.abooks.list.emptyState.createButton,
	)
	const createButtonTo = Routes.addBook.navigate()

	return (
		<div className={styles.container}>
			<Card
				padding="xl"
				radius="lg"
				withBorder
				shadow="sm"
				className={styles.card}
			>
				<Stack align="center" gap="xl">
					<div className={styles.iconWrapper}>
						<IconBook size={64} className={styles.icon} />
					</div>
					<div className={styles.content}>
						<Title order={2} className={styles.title}>
							{title}
						</Title>
						<Text
							size="lg"
							c="dimmed"
							ta="center"
							className={styles.description}
						>
							{description}
						</Text>
					</div>
					<Button
						leftSection={<IconPlus size={20} />}
						variant="filled"
						size="lg"
						component={Link}
						to={createButtonTo}
						radius="md"
					>
						{createButtonLabel}
					</Button>
				</Stack>
			</Card>
		</div>
	)
}
