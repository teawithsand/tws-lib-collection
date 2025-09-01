import { useTheme } from "@/utils/theme/themeHooks"
import { MluiProvider } from "@teawithsand/mlui"
import { ReactNode } from "react"

export type AppMluiProviderProps = {
	children?: ReactNode
}

/**
 * App-specific MluiProvider that automatically applies the theme color scheme
 * based on theme context.
 */
export const AppMluiProvider = ({ children }: AppMluiProviderProps) => {
	const { theme } = useTheme()

	let colorScheme: "light" | "dark" | undefined = undefined
	if (theme === "light" || theme === "dark") {
		colorScheme = theme
	} else {
		colorScheme = undefined
	}

	return (
		<>
			<MluiProvider colorScheme={colorScheme}>{children}</MluiProvider>
		</>
	)
}
