import { Button, Text, Title } from "@mantine/core"
import { IconBook, IconPlus } from "@tabler/icons-react"
import { Link } from "react-router"
import { Routes } from "../../../router/routes"
import styles from "./emptyCollectionsState.module.scss"

/**
 * Component displayed when no collections are available
 */
export const EmptyCollectionsState = () => {
	return (
		<div className={styles.emptyState}>
			<IconBook size={48} className={styles.emptyIcon} />
			<Title order={3} className={styles.emptyTitle}>
				No collections yet
			</Title>
			<Text c="dimmed" className={styles.emptyDescription}>
				Create your first collection to get started with organizing your
				cards.
			</Text>
			<Button
				leftSection={<IconPlus size={16} />}
				variant="filled"
				size="md"
				mt="lg"
				component={Link}
				to={Routes.createCollection.navigate()}
			>
				Create Collection
			</Button>
		</div>
	)
}
