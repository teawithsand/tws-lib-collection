import { useEffect, useRef } from "react"

export const useDrawerCloseGesture = (
	isOpen: boolean,
	onSwipeToClose: () => void,
) => {
	const touchStartX = useRef<number | null>(null)
	const touchStartY = useRef<number | null>(null)

	useEffect(() => {
		if (!isOpen) return

		const handleTouchStart = (e: TouchEvent) => {
			const touch = e.touches[0]
			if (!touch) return

			touchStartX.current = touch.clientX
			touchStartY.current = touch.clientY
		}

		const handleTouchEnd = (e: TouchEvent) => {
			if (touchStartX.current === null || touchStartY.current === null)
				return

			const touch = e.changedTouches[0]
			if (!touch) return

			const deltaX = touch.clientX - touchStartX.current
			const deltaY = touch.clientY - touchStartY.current
			const minSwipeDistance = 50
			const maxVerticalDeviation = 100

			const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY)
			const isLeftwardSwipe = deltaX < -minSwipeDistance
			const isWithinVerticalTolerance =
				Math.abs(deltaY) <= maxVerticalDeviation

			if (
				isHorizontalSwipe &&
				isLeftwardSwipe &&
				isWithinVerticalTolerance
			) {
				onSwipeToClose()
			}

			touchStartX.current = null
			touchStartY.current = null
		}

		document.addEventListener("touchstart", handleTouchStart, {
			passive: true,
		})
		document.addEventListener("touchend", handleTouchEnd, { passive: true })

		return () => {
			document.removeEventListener("touchstart", handleTouchStart)
			document.removeEventListener("touchend", handleTouchEnd)
		}
	}, [isOpen, onSwipeToClose])
}
