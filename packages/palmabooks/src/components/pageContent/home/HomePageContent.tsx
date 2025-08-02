import { AppLocalLayout } from "@/components/layout"
import { Container, Text, Title } from "@teawithsand/mlui"

/**
 * Home page content component containing the welcome content for PalmaBooks.
 * This component includes layout and is ready to be used directly in pages.
 */
export const HomePageContent = () => {
	return (
		<AppLocalLayout>
			<Container>
				<Title order={1}>Welcome to PalmaBooks</Title>
				<Text size="lg" mt="md">
					Your personal book management application
				</Text>
				<Text mt="md">
					Organize your books, track your reading progress, and
					discover new favorites.
				</Text>
			</Container>
		</AppLocalLayout>
	)
}
