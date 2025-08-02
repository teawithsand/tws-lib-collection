import { useErrorBoundary } from "@teawithsand/mlui"
import { GlobalErrorFallback } from "./globalErrorFallback"

/**
 * Autonomous version of GlobalErrorFallback that gets error information
 * from error boundary context automatically. This component should be used
 * as a fallback prop in ErrorBoundary components.
 */
export const AutonomousGlobalErrorFallback = () => {
	const { error, resetErrorBoundary } = useErrorBoundary()

	return (
		<GlobalErrorFallback
			error={error}
			resetErrorBoundary={resetErrorBoundary}
		/>
	)
}
