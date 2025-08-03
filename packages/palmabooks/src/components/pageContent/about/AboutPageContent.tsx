import { Text, Title } from "@teawithsand/mlui"

/**
 * About page content component containing information about PalmaBooks application.
 */
export const AboutPageContent = () => {
	return (
		<>
			<Title order={1}>About PalmaBooks</Title>
			<Text mt="md">
				PalmaBooks is a comprehensive book management application
				designed to help you organize your personal library and track
				your reading journey.
			</Text>
			<Text mt="md">Features include:</Text>
			<ul>
				<li>Organize books by categories</li>
				<li>Track reading progress</li>
				<li>Add personal notes and reviews</li>
				<li>Search and filter your collection</li>
			</ul>
		</>
	)
}
