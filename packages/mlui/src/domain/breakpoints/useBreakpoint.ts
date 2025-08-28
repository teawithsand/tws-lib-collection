import { useEffect, useState } from "react"
import { MluiBreakpoint } from "./types"

export interface BreakpointHelpers {
	current: MluiBreakpoint
	isAtLeast: (breakpoint: MluiBreakpoint) => boolean
	isAtMost: (breakpoint: MluiBreakpoint) => boolean
	is: (breakpoint: MluiBreakpoint) => boolean
	isBetween: (min: MluiBreakpoint, max: MluiBreakpoint) => boolean
}

const breakpointOrder = [
	MluiBreakpoint.XS,
	MluiBreakpoint.SM,
	MluiBreakpoint.MD,
	MluiBreakpoint.LG,
	MluiBreakpoint.XL,
]

/**
 * Hook that returns current breakpoint and helper functions.
 * Uses Mantine breakpoints: xs(0px), sm(576px), md(768px), lg(992px), xl(1200px)
 */
export const useBreakpoint = (): BreakpointHelpers => {
	const [current, setCurrent] = useState<MluiBreakpoint>(() => {
		if (typeof window === "undefined") return MluiBreakpoint.XS

		const width = window.innerWidth
		if (width >= 1200) return MluiBreakpoint.XL
		if (width >= 992) return MluiBreakpoint.LG
		if (width >= 768) return MluiBreakpoint.MD
		if (width >= 576) return MluiBreakpoint.SM
		return MluiBreakpoint.XS
	})

	useEffect(() => {
		const handleResize = () => {
			const width = window.innerWidth

			let newBreakpoint: MluiBreakpoint
			if (width >= 1200) newBreakpoint = MluiBreakpoint.XL
			else if (width >= 992) newBreakpoint = MluiBreakpoint.LG
			else if (width >= 768) newBreakpoint = MluiBreakpoint.MD
			else if (width >= 576) newBreakpoint = MluiBreakpoint.SM
			else newBreakpoint = MluiBreakpoint.XS

			setCurrent(newBreakpoint)
		}

		window.addEventListener("resize", handleResize)

		handleResize()

		return () => {
			window.removeEventListener("resize", handleResize)
		}
	}, [])

	const getBreakpointIndex = (breakpoint: MluiBreakpoint): number =>
		breakpointOrder.indexOf(breakpoint)

	const isAtLeast = (breakpoint: MluiBreakpoint): boolean =>
		getBreakpointIndex(current) >= getBreakpointIndex(breakpoint)

	const isAtMost = (breakpoint: MluiBreakpoint): boolean =>
		getBreakpointIndex(current) <= getBreakpointIndex(breakpoint)

	const is = (breakpoint: MluiBreakpoint): boolean => current === breakpoint

	const isBetween = (min: MluiBreakpoint, max: MluiBreakpoint): boolean => {
		const currentIndex = getBreakpointIndex(current)
		const minIndex = getBreakpointIndex(min)
		const maxIndex = getBreakpointIndex(max)
		return currentIndex >= minIndex && currentIndex <= maxIndex
	}

	return {
		current,
		isAtLeast,
		isAtMost,
		is,
		isBetween,
	}
}

/**
 * @deprecated Use useBreakpoint().current instead
 */
export const useCurrentBreakpoint = (): MluiBreakpoint => {
	const { current } = useBreakpoint()
	return current
}
