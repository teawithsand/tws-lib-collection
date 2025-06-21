import { Routes } from "@/router/routes"
import { Alert, Button, Stack, Text, Title } from "@mantine/core"
import { IconAlertTriangle, IconArrowLeft } from "@tabler/icons-react"
import { Link } from "react-router"
import styles from "./cardNotFound.module.scss"

interface CardNotFoundProps {
	readonly collectionId?: string
}

/**
 * Component displayed when a card is not found or doesn't exist
 */
export const CardNotFound = ({ collectionId }: CardNotFoundProps) => {
	const backToPath = collectionId
		? Routes.collectionDetail.navigate(collectionId)
		: Routes.collections.navigate()

	const backToLabel = collectionId
		? "Back to Collection"
		: "Back to Collections"

	return (
		<div className={styles.container}>
			<Stack align="center" gap="lg">
				<Alert
					icon={<IconAlertTriangle size={16} />}
					title="Card Not Found"
					color="orange"
					variant="light"
					className={styles.alert}
				>
					<Text size="sm">
						The card you're looking for doesn't exist or may have
						been deleted.
					</Text>
				</Alert>

				<div className={styles.content}>
					<Title order={3} ta="center" mb="md">
						Oops! Card Not Found
					</Title>
					<Text size="sm" c="dimmed" ta="center" mb="lg">
						The card you're trying to view either doesn't exist or
						you don't have permission to access it.
					</Text>
				</div>

				<Button
					component={Link}
					to={backToPath}
					leftSection={<IconArrowLeft size={16} />}
					variant="light"
				>
					{backToLabel}
				</Button>
			</Stack>
		</div>
	)
}
