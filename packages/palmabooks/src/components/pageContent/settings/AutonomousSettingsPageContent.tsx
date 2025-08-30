import { useApp } from "@/app/app.hooks"
import { useAtomValue } from "@teawithsand/fstate"
import { SettingsPageContent } from "./SettingsPageContent"

/**
 * Autonomous settings page content component.
 * Handles its own state management and integrates with app services.
 */
export const AutonomousSettingsPageContent = () => {
	const app = useApp()
	const theme = useAtomValue(app.appConfig.consistentAtoms.theme)

	const handleThemeChange = async (newTheme: "light" | "dark" | "auto") => {
		await app.appConfig.setField("theme", newTheme)
	}

	return (
		<SettingsPageContent theme={theme} onThemeChange={handleThemeChange} />
	)
}
