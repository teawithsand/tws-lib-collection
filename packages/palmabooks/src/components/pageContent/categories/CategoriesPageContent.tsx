import { Text, Title } from "@teawithsand/mlui"

/**
 * Categories page content component for organizing books into categories.
 */
export const CategoriesPageContent = () => {
	return (
		<>
			<Title order={1}>Book Categories</Title>
			<Text mt="md">
				Organize your books into different categories for better
				management.
			</Text>
			<Text mt="md" c="dimmed">
				This page is under development. Category management features
				coming soon!
			</Text>
		</>
	)
}
