import { Card, Center, Loader, Stack, Text } from "@mantine/core"
import styles from "./CollectionLearn.module.scss"

/**
 * Component for displaying loading state
 */
export const CollectionLearnLoadingState = () => {
	return (
		<div className={styles.container}>
			<Card shadow="sm" padding="lg" radius="md" withBorder>
				<Center>
					<Stack gap="md" align="center">
						<Loader size="lg" />
						<Text>Loading...</Text>
					</Stack>
				</Center>
			</Card>
		</div>
	)
}
