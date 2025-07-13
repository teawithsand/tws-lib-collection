import { createContext } from "react"
import type { ErrorBoundaryContextValue } from "./types"

/**
 * Context for accessing error boundary functionality within fallback components
 */
export const ErrorBoundaryContext =
	createContext<ErrorBoundaryContextValue | null>(null)
