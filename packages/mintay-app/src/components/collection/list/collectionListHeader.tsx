import { Button, Group, Stack, Text, Title } from "@mantine/core"
import { IconPlus } from "@tabler/icons-react"
import styles from "./collectionListHeader.module.scss"

interface CollectionListHeaderProps {
	onRefresh: () => void
	isLoading?: boolean
	collectionsCount?: number
}

/**
 * Header component for the collections list page with title and action buttons
 */
export const CollectionListHeader = ({
	onRefresh,
	isLoading = false,
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
						variant="light"
						onClick={onRefresh}
						loading={isLoading}
						disabled={isLoading}
					>
						Refresh
					</Button>
					<Button
						leftSection={<IconPlus size={16} />}
						variant="filled"
					>
						New Collection
					</Button>
				</Group>
			</Stack>
		</div>
	)
}
