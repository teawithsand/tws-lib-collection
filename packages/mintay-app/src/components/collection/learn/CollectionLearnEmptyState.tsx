import { Button, Card, Center, Loader, Stack, Text, Title } from "@mantine/core"
import styles from "./CollectionLearn.module.scss"

interface CollectionLearnEmptyStateProps {
	readonly isLoading: boolean
	readonly onStartLearning: () => void
}

/**
 * Component for displaying the initial state before learning begins
 */
export const CollectionLearnEmptyState = ({
	isLoading,
	onStartLearning,
}: CollectionLearnEmptyStateProps) => {
	return (
		<div className={styles.container}>
			<Card shadow="sm" padding="lg" radius="md" withBorder>
				<Stack gap="lg" align="center">
					<Title order={2}>Ready to Learn?</Title>
					<Text ta="center" c="dimmed">
						Start your learning session to review cards using spaced
						repetition. The system will show you cards that are due
						for review.
					</Text>
					{isLoading ? (
						<Center>
							<Stack gap="sm" align="center">
								<Loader size="md" />
								<Text size="sm">Starting session...</Text>
							</Stack>
						</Center>
					) : (
						<Button
							onClick={onStartLearning}
							size="lg"
							disabled={isLoading}
						>
							Start Learning
						</Button>
					)}
				</Stack>
			</Card>
		</div>
	)
}
