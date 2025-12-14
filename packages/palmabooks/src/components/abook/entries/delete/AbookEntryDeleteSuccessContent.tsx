import { useTransResolver } from "@/app/app.hooks"
import { IconCheck } from "@tabler/icons-react"
import { Stack, Text, Title } from "@teawithsand/mlui"

/**
 * Success state content shown after entry is successfully deleted.
 */
export const AbookEntryDeleteSuccessContent = () => {
	const { resolve } = useTransResolver()

	return (
		<Stack gap="md" align="center">
			<IconCheck size={48} color="green" />
			<Title order={3} ta="center">
				{resolve((t) => t.abook.entries.delete.successTitle)}
			</Title>
			<Text size="sm" c="dimmed" ta="center">
				{resolve((t) => t.abook.entries.delete.successMessage)}
			</Text>
		</Stack>
	)
}
