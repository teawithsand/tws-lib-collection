import { Text, Title } from "@teawithsand/mlui"

/**
 * Home page content component containing the welcome content for PalmaBooks.
 */
export const HomePageContent = () => {
	return (
		<>
			<Title order={1}>Welcome to PalmaBooks</Title>
			<Text size="lg" mt="md">
				Your personal book management application
			</Text>
			<Text mt="md">
				Organize your books, track your reading progress, and discover
				new favorites.
			</Text>
		</>
	)
}
