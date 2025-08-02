import { AppLocalLayout } from "@/components/layout"
import { Container, Text, Title } from "@teawithsand/mlui"

/**
 * Categories page content component for organizing books into categories.
 * This component includes layout and is ready to be used directly in pages.
 */
export const CategoriesPageContent = () => {
	return (
		<AppLocalLayout>
			<Container>
				<Title order={1}>Book Categories</Title>
				<Text mt="md">
					Organize your books into different categories for better
					management.
				</Text>
				<Text mt="md" c="dimmed">
					This page is under development. Category management features
					coming soon!
				</Text>
			</Container>
		</AppLocalLayout>
	)
}
