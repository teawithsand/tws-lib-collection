import { Center, Loader, Stack, Text } from "@mantine/core"

import styles from "./loadingFallback.module.scss"

export const LoadingFallback = ({ text }: { text?: string }) => (
	<div className={styles.loadingContainer}>
		<Center>
			<Stack align="center" gap="md">
				<Loader size="lg" type="dots" />
				{text ? (
					<Text size="sm" c="dimmed">
						{text}
					</Text>
				) : null}
			</Stack>
		</Center>
	</div>
)
