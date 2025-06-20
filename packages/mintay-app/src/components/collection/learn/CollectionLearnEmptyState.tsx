import { Card, Center, Loader, Stack, Text, Title } from "@mantine/core"
import styles from "./CollectionLearn.module.scss"

interface CollectionLearnEmptyStateProps {
	readonly isLoading: boolean
}

/**
 * Component for displaying the empty state when no cards are available for learning
 */
export const CollectionLearnEmptyState = ({
	isLoading,
}: CollectionLearnEmptyStateProps) => {
	return (
		<div className={styles.container}>
			<Card shadow="sm" padding="lg" radius="md" withBorder>
				<Stack gap="lg" align="center">
					{isLoading ? (
						<>
							<Title order={2}>Loading...</Title>
							<Text ta="center" c="dimmed">
								Preparing your learning session...
							</Text>
							<Center>
								<Stack gap="sm" align="center">
									<Loader size="md" />
									<Text size="sm">Loading cards...</Text>
								</Stack>
							</Center>
						</>
					) : (
						<>
							<Title order={2}>No Cards Available</Title>
							<Text ta="center" c="dimmed">
								There are no cards available for review at this
								time. All cards may be scheduled for future
								review, or the collection might be empty.
							</Text>
						</>
					)}
				</Stack>
			</Card>
		</div>
	)
}
