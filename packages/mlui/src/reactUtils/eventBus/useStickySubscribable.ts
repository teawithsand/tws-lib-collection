import type { StickySubscribable } from "@teawithsand/fstate"
import { useEffect, useState } from "react"

/**
 * React hook that subscribes to a StickySubscribable and returns its current value.
 *
 * @param subscribable - The StickySubscribable to subscribe to
 * @returns The current value from the StickySubscribable
 */
export const useStickySubscribable = <T>(
	subscribable: StickySubscribable<T>,
): T => {
	const [value, setValue] = useState<T>(() => subscribable.lastEvent)

	useEffect(() => {
		setValue(subscribable.lastEvent)

		const unsubscribe = subscribable.addSubscriber((newValue: T) => {
			setValue(newValue)
		})

		return unsubscribe
	}, [subscribable])

	return value
}
