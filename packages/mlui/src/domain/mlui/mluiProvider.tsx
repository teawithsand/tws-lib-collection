import {
	MantineColorScheme,
	MantineProvider,
	MantineThemeOverride,
} from "@mantine/core"
import { ReactNode } from "react"

export type MluiProviderProps = {
	children?: ReactNode
	colorScheme?: MantineColorScheme
	theme?: MantineThemeOverride
}

/**
 * Provides all the things that this library needs.
 *
 * Right now it only wraps MantineProvider with configurable theme and color scheme support.
 */
export const MluiProvider = ({
	children,
	colorScheme,
	theme,
}: MluiProviderProps) => {
	const finalTheme = theme ? theme : undefined

	if (colorScheme === "auto") {
		colorScheme = undefined
	}

	return (
		<MantineProvider
			withGlobalClasses={true}
			theme={finalTheme}
			forceColorScheme={colorScheme}
		>
			{children}
		</MantineProvider>
	)
}
