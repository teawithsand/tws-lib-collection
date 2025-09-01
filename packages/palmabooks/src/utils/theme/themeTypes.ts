import { ReactNode } from "react"
import { type Theme } from "./themeVersioned"

/**
 * Interface for theme context functionality.
 */
export interface ThemeContextValue {
	/**
	 * Current theme value.
	 */
	readonly theme: Theme

	/**
	 * Sets the theme value and persists it to local storage.
	 */
	readonly setTheme: (theme: Theme) => void
}

/**
 * Props for ThemeProvider component.
 */
export interface ThemeProviderProps {
	readonly children: ReactNode
}
