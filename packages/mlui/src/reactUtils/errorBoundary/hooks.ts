import { useContext } from "react"
import { ErrorBoundaryContext } from "./context"
import type { ErrorBoundaryContextValue } from "./types"

/**
 * Hook to access error boundary context within fallback components
 * @throws Error if used outside of an ErrorBoundary fallback component
 */
export const useErrorBoundary = (): ErrorBoundaryContextValue => {
	const context = useContext(ErrorBoundaryContext)
	if (!context) {
		throw new Error(
			"useErrorBoundary must be used within an ErrorBoundary fallback component",
		)
	}
	return context
}

/**
 * Hook to optionally access error boundary context within fallback components
 * @returns ErrorBoundaryContextValue or null if not within an ErrorBoundary fallback component
 */
export const useErrorBoundaryOptional =
	(): ErrorBoundaryContextValue | null => {
		return useContext(ErrorBoundaryContext)
	}
