import { useTransResolver } from "@/app/app.hooks"
import { IconAlertTriangle, IconTrash } from "@tabler/icons-react"
import { Alert, Button, Group, Stack, Text } from "@teawithsand/mlui"

export interface AbookEntryDeleteErrorContentProps {
	readonly error: string
	readonly onClose: () => void
	readonly onRetry: () => void | Promise<void>
}

/**
 * Error state content shown when entry deletion fails.
 * Displays error message and provides retry option.
 */
export const AbookEntryDeleteErrorContent = ({
	error,
	onClose,
	onRetry,
}: AbookEntryDeleteErrorContentProps) => {
	const { resolve } = useTransResolver()

	return (
		<Stack gap="md">
			<Alert
				icon={<IconAlertTriangle size="1rem" />}
				title={resolve((t) => t.abook.entries.delete.errorTitle)}
				color="red"
			>
				<Text size="sm">{error}</Text>
			</Alert>
			<Group justify="flex-end" gap="md">
				<Button onClick={onClose} variant="light">
					{resolve((t) => t.abook.entries.delete.closeButton)}
				</Button>
				<Button
					color="red"
					leftSection={<IconTrash size={16} />}
					onClick={onRetry}
				>
					{resolve((t) => t.abook.entries.delete.deleteButton)}
				</Button>
			</Group>
		</Stack>
	)
}
