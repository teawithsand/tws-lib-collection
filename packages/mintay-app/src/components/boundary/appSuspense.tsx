import { Center, Loader, Stack, Text } from "@mantine/core"
import { ReactNode, Suspense } from "react"
import { useTransResolver } from "../../app/trans/hook"
import styles from "./appSuspense.module.scss"

interface AppSuspenseProps {
	children: ReactNode
}

export const AppSuspense = ({ children }: AppSuspenseProps) => {
	const resolver = useTransResolver()

	const LoadingFallback = () => (
		<div className={styles.loadingContainer}>
			<Center>
				<Stack align="center" gap="md">
					<Loader size="lg" type="dots" />
					<Text size="sm" c="dimmed">
						{resolver.resolve((t) => t.generic.loading())}
					</Text>
				</Stack>
			</Center>
		</div>
	)

	return <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
}
