import { AppLocalLayout } from "@/components/layout"
import { Container, Stack, Text, Title } from "@teawithsand/mlui"

/**
 * About page - minimal MVP version.
 */
export const AboutPage = () => {
	return (
		<AppLocalLayout>
			<Container>
				<Stack gap="md">
					<Title order={1}>About PalmaBooks</Title>
					<Text>
						PalmaBooks is an audiobook management application that
						helps you organize and manage your audiobook library.
					</Text>
					<Text size="sm" c="dimmed">
						Version: 0.0.0 (MVP)
					</Text>
				</Stack>
			</Container>
		</AppLocalLayout>
	)
}
