import { useCallback, useState } from "react"
import { ThemeContext } from "./themeContextDefinition"
import { type ThemeContextValue, type ThemeProviderProps } from "./themeTypes"
import { themeVersionedType, type Theme } from "./themeVersioned"

/**
 * Storage key for theme persistence.
 */
const STORAGE_KEY = "palmabooks-theme"

/**
 * Loads theme from local storage with proper deserialization.
 */
const loadThemeFromStorage = (): Theme => {
	try {
		if (typeof window === "undefined" || !window.localStorage) {
			return "auto"
		}

		const stored = window.localStorage.getItem(STORAGE_KEY)
		if (!stored) {
			return "auto"
		}

		const parsed = JSON.parse(stored)
		return themeVersionedType.deserialize(parsed)
	} catch {
		clearThemeStorage()
		return "auto"
	}
}

/**
 * Saves theme to local storage with proper serialization.
 */
const saveThemeToStorage = (theme: Theme): void => {
	try {
		if (typeof window === "undefined" || !window.localStorage) {
			return
		}

		const serialized = themeVersionedType.serialize(theme)
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized))
	} catch {
		clearThemeStorage()
	}
}

/**
 * Clears theme from local storage.
 */
const clearThemeStorage = (): void => {
	try {
		if (typeof window !== "undefined" && window.localStorage) {
			window.localStorage.removeItem(STORAGE_KEY)
		}
	} catch {
		return
	}
}

/**
 * Provider component for theme context.
 * Handles theme state management and persistence.
 */
export const ThemeProvider = ({ children }: ThemeProviderProps) => {
	const [theme, setThemeState] = useState<Theme>(() => loadThemeFromStorage())

	const setTheme = useCallback((newTheme: Theme) => {
		setThemeState(newTheme)
		saveThemeToStorage(newTheme)
	}, [])

	const contextValue: ThemeContextValue = {
		theme,
		setTheme,
	}

	return (
		<ThemeContext.Provider value={contextValue}>
			{children}
		</ThemeContext.Provider>
	)
}
