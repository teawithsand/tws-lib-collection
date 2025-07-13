import type { ErrorInfo, ReactNode } from "react"

/**
 * Internal state of the ErrorBoundary component
 */
export interface ErrorBoundaryState {
	/** Whether an error has been caught by the boundary */
	readonly hasError: boolean
	/** The caught error, if any */
	readonly error: Error | null
	/** Additional error information provided by React, if any */
	readonly errorInfo: ErrorInfo | null
}

/**
 * Props for the ErrorBoundary component
 */
export interface ErrorBoundaryProps {
	/** Child components to be wrapped by the error boundary */
	readonly children: ReactNode
	/**
	 * Fallback UI to render when an error is caught.
	 * This component will have access to error boundary context via hooks.
	 */
	readonly fallback: ReactNode
	/**
	 * Optional callback function called when an error is caught.
	 * Useful for logging errors to external services.
	 * @param error - The caught error
	 * @param errorInfo - Additional error information from React
	 */
	readonly onError?: (error: Error, errorInfo: ErrorInfo) => void
	/**
	 * Whether to automatically reset the error boundary when props change.
	 * When true, the error boundary will reset if any of the resetKeys change.
	 * @default false
	 */
	readonly resetOnPropsChange?: boolean
	/**
	 * Array of values to watch for changes when resetOnPropsChange is true.
	 * When any of these values change, the error boundary will reset.
	 * Useful for resetting errors when user navigates or data changes.
	 */
	readonly resetKeys?: readonly unknown[]
}

/**
 * Context value provided to fallback components
 */
export interface ErrorBoundaryContextValue {
	readonly error: Error
	readonly errorInfo: ErrorInfo
	readonly resetErrorBoundary: () => void
}
