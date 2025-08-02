import { AppLocalLayout } from "@/components/layout"
import { Container, Text, Title } from "@teawithsand/mlui"

/**
 * Settings page content component for configuring PalmaBooks application preferences.
 * This component includes layout and is ready to be used directly in pages.
 */
export const SettingsPageContent = () => {
	return (
		<AppLocalLayout>
			<Container>
				<Title order={1}>Settings</Title>
				<Text mt="md">
					Configure your PalmaBooks application preferences.
				</Text>
				<Text mt="md" c="dimmed">
					This page is under development. Settings configuration
					coming soon!
				</Text>
			</Container>
		</AppLocalLayout>
	)
}
