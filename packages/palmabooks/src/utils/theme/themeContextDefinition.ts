import { createContext } from "react"
import { type ThemeContextValue } from "./themeTypes"

/**
 * React context for theme management.
 */
export const ThemeContext = createContext<ThemeContextValue | null>(null)
