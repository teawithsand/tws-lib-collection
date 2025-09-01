import { useTheme } from "@/utils/theme"
import { SettingsPageContent } from "./SettingsPageContent"

/**
 * Autonomous settings page content component.
 * Handles its own state management and integrates with theme context.
 */
export const AutonomousSettingsPageContent = () => {
	const { theme, setTheme } = useTheme()

	const handleThemeChange = async (newTheme: "light" | "dark" | "auto") => {
		setTheme(newTheme)
	}

	return (
		<SettingsPageContent theme={theme} onThemeChange={handleThemeChange} />
	)
}
