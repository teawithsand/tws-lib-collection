import { Routes } from "@/router/routes"
import { Alert, Button, Stack, Text, Title } from "@mantine/core"
import { IconAlertTriangle, IconArrowLeft } from "@tabler/icons-react"
import { Link } from "react-router"
import styles from "./collectionNotFound.module.scss"

/**
 * Component displayed when a collection is not found or doesn't exist
 */
export const CollectionNotFound = () => {
	return (
		<div className={styles.container}>
			<Stack align="center" gap="lg">
				<Alert
					icon={<IconAlertTriangle size={16} />}
					title="Collection Not Found"
					color="orange"
					variant="light"
					className={styles.alert}
				>
					<Text size="sm">
						The collection you're looking for doesn't exist or may
						have been deleted.
					</Text>
				</Alert>

				<div className={styles.content}>
					<Title order={3} ta="center" mb="md">
						Oops! Collection Not Found
					</Title>
					<Text size="sm" c="dimmed" ta="center" mb="lg">
						The collection you're trying to view either doesn't
						exist or you don't have permission to access it.
					</Text>
				</div>

				<Button
					component={Link}
					to={Routes.collections.navigate()}
					leftSection={<IconArrowLeft size={16} />}
					variant="light"
				>
					Back to Collections
				</Button>
			</Stack>
		</div>
	)
}
