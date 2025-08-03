import { useTransResolver } from "@/app/app.hooks"
import { Button, Stack, Text } from "@teawithsand/mlui"

/**
 * Component displayed when an audiobook is not found.
 */
export const AbookShowNotFound = () => {
	const { resolve } = useTransResolver()

	return (
		<Stack gap="lg">
			<Text variant="h1">{resolve((t) => t.abooks.notFound.title)}</Text>
			<Text>{resolve((t) => t.abooks.notFound.description)}</Text>
			<Button variant="primary" onClick={() => window.history.back()}>
				{resolve((t) => t.abooks.notFound.goBackButton)}
			</Button>
		</Stack>
	)
}
