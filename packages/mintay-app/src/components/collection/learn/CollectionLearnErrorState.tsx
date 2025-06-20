import { Button, Card, Stack, Text, Title } from "@mantine/core"
import styles from "./CollectionLearn.module.scss"

interface CollectionLearnErrorStateProps {
	readonly error: Error
	readonly onRetry: () => void
}

/**
 * Component for displaying error state during learning
 */
export const CollectionLearnErrorState = ({
	error,
	onRetry,
}: CollectionLearnErrorStateProps) => {
	return (
		<div className={styles.container}>
			<Card shadow="sm" padding="lg" radius="md" withBorder>
				<Stack gap="lg" align="center">
					<Title order={2} c="red">
						Something went wrong
					</Title>
					<Text ta="center" c="dimmed">
						{error.message ||
							"An unexpected error occurred while loading the learning session."}
					</Text>
					<Button onClick={onRetry} variant="light" color="red">
						Try Again
					</Button>
				</Stack>
			</Card>
		</div>
	)
}
