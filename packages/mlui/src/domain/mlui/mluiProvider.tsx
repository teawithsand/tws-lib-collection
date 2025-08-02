import { MantineProvider } from "@mantine/core"
import { ReactNode } from "react"

export type MluiProviderProps = {
	children?: ReactNode
}

/**
 * Provides all the things that this library needs.
 *
 * Right now it only wraps MantineProvider.
 */
export const MluiProvider = ({ children }: MluiProviderProps) => {
	return <MantineProvider>{children}</MantineProvider>
}
