import { Container, Stack, Text, Title } from "@mantine/core"

/**
 * Main application component for the File Manager App.
 */
export const App = () => {
	return (
		<Container size="md" py="xl">
			<Stack gap="md">
				<Title order={1}>File Manager App</Title>
				<Text>
					Welcome to the File Manager App. This application uses the
					@teawithsand/file-manager package.
				</Text>
			</Stack>
		</Container>
	)
}
