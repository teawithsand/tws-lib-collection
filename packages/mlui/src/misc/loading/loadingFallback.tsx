import { Center, Loader, Stack, Text } from "@mantine/core"

import styles from "./loadingFallback.module.scss"
import { LoadingFallbackVariant } from "./loadingFallbackVariant"

/**
 * Props for the LoadingFallback component.
 */
export interface LoadingFallbackProps {
	/** Optional text to display below the loading spinner */
	readonly text?: string
	/** Variant that controls the appearance and positioning of the loading indicator */
	readonly variant?: LoadingFallbackVariant
}

/**
 * A loading fallback component that displays a centered loading indicator.
 *
 * This component renders a visually appealing loading state consisting of:
 * - A large animated dots-style spinner (Mantine Loader component)
 * - Optional descriptive text displayed below the spinner in a dimmed color
 * - All content is vertically and horizontally centered within the container
 * - Uses a consistent medium gap between the spinner and text elements
 *
 * The component supports two variants:
 * - **Fullscreen**: Creates a fixed overlay that covers the entire viewport with a semi-transparent background
 * - **Inline** (default): Displays as an inline element that fits within its parent container
 *
 * The component is designed to be used as a fallback UI for loading states,
 * particularly within React Suspense boundaries or other async loading scenarios.
 * It provides a clean, professional appearance that integrates well with
 * Mantine's design system.
 *
 * @param props - The component props
 * @param props.text - Optional descriptive text to show below the loading spinner
 * @param props.variant - Controls the positioning and styling (fullscreen overlay vs inline)
 * @returns A centered loading indicator with optional text
 *
 * @example
 * ```tsx
 * // Simple inline loading indicator (default)
 * <LoadingFallback />
 *
 * // Fullscreen loading overlay
 * <LoadingFallback variant={LoadingFallbackVariant.Fullscreen} />
 *
 * // Inline loading indicator with descriptive text
 * <LoadingFallback
 *   variant={LoadingFallbackVariant.Inline}
 *   text="Loading your data..."
 * />
 * ```
 */
export const LoadingFallback = ({
	text,
	variant = LoadingFallbackVariant.Fullscreen,
}: LoadingFallbackProps) => {
	const containerClass =
		variant === LoadingFallbackVariant.Fullscreen
			? styles.loadingContainerFullscreen
			: styles.loadingContainerInline

	return (
		<div className={containerClass}>
			<Center>
				<Stack align="center" gap="md">
					<Loader size="lg" type="dots" />
					{text ? (
						<Text size="sm" c="dimmed">
							{text}
						</Text>
					) : null}
				</Stack>
			</Center>
		</div>
	)
}
