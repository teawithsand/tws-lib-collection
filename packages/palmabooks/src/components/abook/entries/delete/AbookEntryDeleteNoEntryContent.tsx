import { useTransResolver } from "@/app/app.hooks"
import { IconAlertTriangle } from "@tabler/icons-react"
import { Alert, Button, Stack, Text } from "@teawithsand/mlui"

export interface AbookEntryDeleteNoEntryContentProps {
	readonly onClose: () => void
}

/**
 * Content shown when no entry is selected for deletion.
 */
export const AbookEntryDeleteNoEntryContent = ({
	onClose,
}: AbookEntryDeleteNoEntryContentProps) => {
	const { resolve } = useTransResolver()

	return (
		<Stack gap="md" align="center">
			<Alert
				icon={<IconAlertTriangle size="1rem" />}
				title={resolve((t) => t.abook.entries.delete.errorTitle)}
				color="orange"
			>
				<Text size="sm">
					{resolve((t) => t.abook.entries.delete.noEntrySelected)}
				</Text>
			</Alert>
			<Button onClick={onClose} variant="light">
				{resolve((t) => t.abook.entries.delete.closeButton)}
			</Button>
		</Stack>
	)
}
