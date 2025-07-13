import { type ReactNode } from "react"

/**
 * Props for a navigation link component
 */
export interface LinkProps {
	readonly to: string
	readonly children: ReactNode
	readonly className?: string
	readonly replace?: boolean
	readonly state?: unknown
}
