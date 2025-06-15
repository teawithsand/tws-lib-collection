import { ReactNode } from "react"
import { useAppOptional } from "./appHook"

interface AppBoundaryProps {
	children: ReactNode
	fallback?: ReactNode
}

/**
 * App Boundary component that renders fallback UI until App is fully loaded
 * This ensures app hooks can be safely used within the children
 */
export const AppBoundary = ({ children, fallback }: AppBoundaryProps) => {
	const app = useAppOptional()

	if (!app) {
		return fallback ?? <></>
	}

	return <>{children}</>
}
