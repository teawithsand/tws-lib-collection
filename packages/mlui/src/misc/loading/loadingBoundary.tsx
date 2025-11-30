import { Suspense } from "react"
import { LoadingFallback } from "./loadingFallback"
import { LoadingFallbackVariant } from "./loadingFallbackVariant"

/**
 * Props for the LoadingSuspenseBoundary component.
 */
export interface LoadingSuspenseBoundaryProps {
	/** The children components to render when not loading */
	readonly children: React.ReactNode
	/** Optional loading text to display in the fallback */
	readonly text?: string
	/** Variant that controls the appearance and positioning of the loading indicator */
	readonly variant?: LoadingFallbackVariant
}

/**
 * A boundary component that handles loading states using React Suspense
 * with a standardized loading fallback.
 *
 * When children components are loading (suspended), this component displays
 * a centered loading indicator with animated dots and optional descriptive text.
 * The loading fallback can be displayed either as an inline element within its
 * container or as a fullscreen overlay depending on the variant prop.
 *
 * The loading state takes up the appropriate space based on the variant and
 * presents a clean, professional loading experience consistent with Mantine's design system.
 *
 * @param props - The component props
 * @param props.children - The child components to render when not in loading state
 * @param props.text - Optional text to display below the loading spinner
 * @param props.variant - Controls whether loading appears inline or as fullscreen overlay
 * @returns A Suspense boundary with consistent loading fallback UI
 *
 * @example
 * ```tsx
 * // Inline loading (default)
 * <LoadingSuspenseBoundary text="Loading data...">
 *   <MyAsyncComponent />
 * </LoadingSuspenseBoundary>
 *
 * // Fullscreen loading overlay
 * <LoadingSuspenseBoundary
 *   variant={LoadingFallbackVariant.Fullscreen}
 *   text="Loading application..."
 * >
 *   <MyAsyncComponent />
 * </LoadingSuspenseBoundary>
 * ```
 */
export const LoadingSuspenseBoundary = ({
	children,
	text,
	variant,
}: LoadingSuspenseBoundaryProps) => (
	<Suspense fallback={<LoadingFallback text={text} variant={variant} />}>
		{children}
	</Suspense>
)
