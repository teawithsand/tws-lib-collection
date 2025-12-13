import { AppLocalLayout } from "@/components/layout"
import { Container, Stack, Text, Title } from "@teawithsand/mlui"

export const HomePage = () => {
	return (
		<AppLocalLayout>
			<Container>
				<Stack gap="md">
					<Title order={1}>Welcome to PalmaBooks</Title>
					<Text size="lg">Your audiobook library manager</Text>
					<Text>
						Organize and manage your audiobook collection with ease.
						Create audiobooks, upload files, and keep track of your
						listening progress.
					</Text>
				</Stack>
			</Container>
		</AppLocalLayout>
	)
}
