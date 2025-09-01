import { useContext } from "react"
import { ThemeContext } from "./themeContextDefinition"
import { type ThemeContextValue } from "./themeTypes"

/**
 * Hook to use theme context.
 * Throws an error if used outside of ThemeProvider.
 */
export const useTheme = (): ThemeContextValue => {
	const context = useContext(ThemeContext)
	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider")
	}
	return context
}
