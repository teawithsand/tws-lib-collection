import { Component, type ErrorInfo, type ReactNode } from "react"
import { ErrorBoundaryContext } from "./context"
import type {
	ErrorBoundaryContextValue,
	ErrorBoundaryProps,
	ErrorBoundaryState,
} from "./types"

// TODO(teawithsand): unit tests for this boundary

/**
 * React Error Boundary component that catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 */
export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	public constructor(props: ErrorBoundaryProps) {
		super(props)
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
		}
	}

	/**
	 * Static method called when an error is thrown in a child component
	 */
	public static getDerivedStateFromError = (
		error: Error,
	): Partial<ErrorBoundaryState> => {
		return {
			hasError: true,
			error,
		}
	}

	/**
	 * Lifecycle method called when an error is caught
	 */
	public componentDidCatch = (error: Error, errorInfo: ErrorInfo): void => {
		this.setState({
			errorInfo,
		})

		this.props.onError?.(error, errorInfo)
	}

	/**
	 * Check if reset keys have changed to automatically reset the error boundary
	 */
	public componentDidUpdate = (prevProps: ErrorBoundaryProps): void => {
		const { resetKeys, resetOnPropsChange } = this.props
		const { hasError } = this.state

		if (hasError && resetOnPropsChange && resetKeys) {
			const hasResetKeyChanged = resetKeys.some(
				(key, index) => key !== prevProps.resetKeys?.[index],
			)

			if (hasResetKeyChanged) {
				this.resetErrorBoundary()
			}
		}
	}

	/**
	 * Reset the error boundary state
	 */
	public readonly resetErrorBoundary = (): void => {
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
		})
	}

	public render = (): ReactNode => {
		const { hasError, error, errorInfo } = this.state
		const { children, fallback } = this.props

		if (hasError && error) {
			const contextValue: ErrorBoundaryContextValue = {
				error,
				errorInfo,
				resetErrorBoundary: this.resetErrorBoundary,
			}

			return (
				<ErrorBoundaryContext.Provider value={contextValue}>
					{fallback}
				</ErrorBoundaryContext.Provider>
			)
		}

		return children
	}
}
