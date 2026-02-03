import { useCallback, useEffect, useRef, type RefObject } from "react"

export interface UseLongPressSelectionOptions {
	readonly delayMs?: number
	readonly isEnabled?: boolean
	readonly ignoreElements?: readonly RefObject<HTMLElement | null>[]
	readonly onLongPress: () => void
}

export interface UseLongPressSelectionHandlers {
	readonly onPointerDown: (event: React.PointerEvent<HTMLElement>) => void
	readonly onPointerUp: () => void
	readonly onPointerLeave: () => void
	readonly onPointerCancel: () => void
	readonly onPointerMove: (event: React.PointerEvent<HTMLElement>) => void
}

/**
 * Handles long-press interactions on an element.
 */
export const useLongPressSelection = ({
	delayMs = 500,
	isEnabled = true,
	ignoreElements = [],
	onLongPress,
}: UseLongPressSelectionOptions): UseLongPressSelectionHandlers => {
	const timerRef = useRef<number | null>(null)

	const clearTimer = useCallback(() => {
		if (timerRef.current !== null) {
			window.clearTimeout(timerRef.current)
			timerRef.current = null
		}
	}, [])

	const shouldIgnoreTarget = useCallback(
		(target: EventTarget | null) => {
			if (!target || !(target instanceof Node)) return false
			return ignoreElements.some((elementRef) => {
				const element = elementRef.current
				return element ? element.contains(target) : false
			})
		},
		[ignoreElements],
	)

	const onPointerDown = useCallback(
		(event: React.PointerEvent<HTMLElement>) => {
			if (!isEnabled) return
			if (shouldIgnoreTarget(event.target)) return

			clearTimer()
			timerRef.current = window.setTimeout(() => {
				onLongPress()
				timerRef.current = null
			}, delayMs)
		},
		[clearTimer, delayMs, isEnabled, onLongPress, shouldIgnoreTarget],
	)

	const onPointerUp = useCallback(() => {
		clearTimer()
	}, [clearTimer])

	const onPointerLeave = useCallback(() => {
		clearTimer()
	}, [clearTimer])

	const onPointerCancel = useCallback(() => {
		clearTimer()
	}, [clearTimer])

	const onPointerMove = useCallback(
		(event: React.PointerEvent<HTMLElement>) => {
			if (event.pointerType !== "mouse") {
				clearTimer()
			}
		},
		[clearTimer],
	)

	useEffect(() => {
		return () => {
			clearTimer()
		}
	}, [clearTimer])

	return {
		onPointerDown,
		onPointerUp,
		onPointerLeave,
		onPointerCancel,
		onPointerMove,
	}
}
