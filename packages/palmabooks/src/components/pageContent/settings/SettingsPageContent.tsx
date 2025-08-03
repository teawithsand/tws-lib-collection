import { Text, Title } from "@teawithsand/mlui"

/**
 * Settings page content component for configuring PalmaBooks application preferences.
 */
export const SettingsPageContent = () => {
	return (
		<>
			<Title order={1}>Settings</Title>
			<Text mt="md">
				Configure your PalmaBooks application preferences.
			</Text>
			<Text mt="md" c="dimmed">
				This page is under development. Settings configuration coming
				soon!
			</Text>
		</>
	)
}
