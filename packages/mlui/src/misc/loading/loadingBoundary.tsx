import { Suspense } from "react"
import { LoadingFallback } from "./loadingFallback"

/**
 * LoadingBoundary component that wraps children with React Suspense
 * and uses LoadingFallback as the fallback component.
 */
export interface LoadingBoundaryProps {
	/** The children components to render when not loading */
	readonly children: React.ReactNode
	/** Optional loading text to display in the fallback */
	readonly text?: string
}

/**
 * A boundary component that handles loading states using React Suspense
 * with a standardized loading fallback.
 */
export const LoadingBoundary = ({ children, text }: LoadingBoundaryProps) => (
	<Suspense fallback={<LoadingFallback text={text} />}>{children}</Suspense>
)
