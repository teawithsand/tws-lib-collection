import { useTransResolver } from "@/app/app.hooks"
import { Routes } from "@/router"
import { IconBook } from "@tabler/icons-react"
import { Button, Center, Stack, Text, useNavigation } from "@teawithsand/mlui"

/**
 * Component displayed when an audiobook is not found.
 */
export const AbookNotFound = () => {
	const { resolve } = useTransResolver()
	const navigation = useNavigation()

	const handleBackToList = () => {
		navigation.navigate(Routes.listAbooks.navigate())
	}

	return (
		<Center style={{ minHeight: "50vh" }}>
			<Stack align="center" gap="md">
				<IconBook size={48} stroke={1.5} opacity={0.3} />
				<Text size="lg" fw={500}>
					{resolve((t) => t.abook.show.notFound)}
				</Text>
				<Button onClick={handleBackToList} variant="light">
					{resolve((t) => t.abook.show.backToList)}
				</Button>
			</Stack>
		</Center>
	)
}
