import { useTransResolver } from "@/app/app.hooks"
import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react"
import { Alert, Button, Container, Stack, Text, Title } from "@teawithsand/mlui"
import styles from "./globalErrorFallback.module.scss"

export interface GlobalErrorFallbackProps {
	readonly error: Error
	readonly resetErrorBoundary: () => void
}

/**
 * Global error fallback component that displays when an unhandled error occurs.
 * Provides users with error information and ability to refresh the page.
 */
export const GlobalErrorFallback = ({ error }: GlobalErrorFallbackProps) => {
	const resolver = useTransResolver()

	const handleRefresh = () => {
		window.location.reload()
	}

	return (
		<Container size="md" className={styles.container}>
			<Stack align="center" gap="xl">
				<div className={styles.iconWrapper}>
					<IconAlertTriangle size={64} className={styles.errorIcon} />
				</div>

				<Stack align="center" gap="md">
					<Title order={1} className={styles.title}>
						{resolver.resolve((t) => t.globalErrorFallback.title)}
					</Title>
					<Text
						size="lg"
						c="dimmed"
						ta="center"
						className={styles.description}
					>
						{resolver.resolve(
							(t) => t.globalErrorFallback.description,
						)}
					</Text>
				</Stack>

				<Alert
					variant="light"
					color="red"
					icon={<IconAlertTriangle size={16} />}
					className={styles.errorAlert}
				>
					<Text size="sm" fw={500}>
						{resolver.resolve(
							(t) => t.globalErrorFallback.errorDetailsLabel,
						)}
					</Text>
					<Text size="sm" c="dimmed" className={styles.errorMessage}>
						{error.message ||
							resolver.resolve(
								(t) =>
									t.globalErrorFallback.unknownErrorMessage,
							)}
					</Text>
				</Alert>

				<Button
					size="lg"
					leftSection={<IconRefresh size={20} />}
					onClick={handleRefresh}
					className={styles.refreshButton}
				>
					{resolver.resolve(
						(t) => t.globalErrorFallback.refreshButtonText,
					)}
				</Button>
			</Stack>
		</Container>
	)
}
