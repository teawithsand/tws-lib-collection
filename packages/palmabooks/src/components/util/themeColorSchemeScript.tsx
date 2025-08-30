import { useApp } from "@/app/app.hooks"
import { useAtomValue } from "@teawithsand/fstate"
import { ColorSchemeScript } from "@teawithsand/mlui"
import { useEffect, useState } from "react"

/**
 * Component that applies the theme color scheme based on app configuration.
 * Uses ColorSchemeScript to set the proper theme (light/dark/auto) for the application.
 */
export const ThemeColorSchemeScript = () => {
	const app = useApp()
	const themeValue = useAtomValue(app.appConfig.consistentLoadableAtoms.theme)
	const [forceColorScheme, setForceColorScheme] = useState<
		"light" | "dark" | undefined
	>()

	useEffect(() => {
		if (themeValue.state !== "hasData") return
		const theme = themeValue.data
		if (theme === "light" || theme === "dark") {
			setForceColorScheme(theme)
		} else {
			setForceColorScheme(undefined)
		}
	}, [themeValue])

	return (
		<>
			{forceColorScheme ? (
				<ColorSchemeScript forceColorScheme={forceColorScheme} />
			) : undefined}
		</>
	)
}
