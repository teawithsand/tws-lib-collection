import { Button, Group, Stack, Text, Title } from "@mantine/core"
import { IconPlus } from "@tabler/icons-react"
import { Link } from "react-router"
import { Routes } from "../../../router/routes"
import styles from "./collectionListHeader.module.scss"

interface CollectionListHeaderProps {
	readonly isLoading?: boolean
	readonly collectionsCount?: number
}

/**
 * Header component for the collections list page with title and action buttons
 */
export const CollectionListHeader = ({
	collectionsCount,
}: CollectionListHeaderProps) => {
	return (
		<div className={styles.header}>
			<Stack align="center" gap="lg">
				<div className={styles.headerText}>
					<Title order={1} className={styles.pageTitle}>
						Collections
					</Title>
					<Text c="dimmed" className={styles.pageSubtitle}>
						{collectionsCount !== undefined
							? `${collectionsCount} collection${collectionsCount !== 1 ? "s" : ""}`
							: "Manage your card collections"}
					</Text>
				</div>
				<Group>
					<Button
						leftSection={<IconPlus size={16} />}
						variant="filled"
						component={Link}
						to={Routes.createCollection.navigate()}
					>
						New Collection
					</Button>
				</Group>
			</Stack>
		</div>
	)
}
