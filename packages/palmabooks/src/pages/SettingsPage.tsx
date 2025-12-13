import { AppLocalLayout } from "@/components/layout"
import { useTheme } from "@/utils/theme"
import { Container, Select, Stack, Text, Title } from "@teawithsand/mlui"

/**
 * Settings page - minimal MVP version with theme selection only.
 */
export const SettingsPage = () => {
	const { theme, setTheme } = useTheme()

	return (
		<AppLocalLayout>
			<Container>
				<Stack gap="lg">
					<Title order={1}>Settings</Title>

					<Stack gap="xs">
						<Text fw={500}>Theme</Text>
						<Select
							value={theme}
							onChange={(value) =>
								value &&
								setTheme(value as "light" | "dark" | "auto")
							}
							data={[
								{ value: "auto", label: "Auto" },
								{ value: "light", label: "Light" },
								{ value: "dark", label: "Dark" },
							]}
						/>
						<Text size="sm" c="dimmed">
							Choose your preferred color scheme
						</Text>
					</Stack>
				</Stack>
			</Container>
		</AppLocalLayout>
	)
}
