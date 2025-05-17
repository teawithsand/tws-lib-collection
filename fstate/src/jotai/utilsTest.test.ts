import { createStore } from "jotai"
import { describe, expect, test } from "vitest"

import { DefaultStickyEventBus } from "../subscribable"

import { AtomUtil } from "./utils"

describe("Bus atom", () => {
	test("can't imperatively read its true value without subscription", () => {
		const store = createStore()

		const bus = new DefaultStickyEventBus(1)
		const atom = AtomUtil.stickySubscribableAtom(bus)

		// Initially, get returns the init value from bus
		expect(store.get(atom)).toEqual(1)

		bus.emitEvent(2)

		// Without subscription, store.get(atom) still returns the initial value
		expect(store.get(atom)).toEqual(1)
	})

	test(
		"value updates after subscribing to the atom",
		{ timeout: Infinity },
		() => {
			const store = createStore()

			const bus = new DefaultStickyEventBus(1)
			const atom = AtomUtil.stickySubscribableAtom(bus)

			bus.emitEvent(2)

			// Before subscription, will still get the old value
			expect(store.get(atom)).toEqual(1)

			// Subscribing to atom triggers update
			store.sub(atom, () => {
				const value = store.get(atom)
				expect(value).toEqual(2)
			})

			// After subscription, get returns latest value from bus
			expect(store.get(atom)).toEqual(2)
		},
	)

	test("can set value of the imperativeSetAtom", () => {
		const store = createStore()
		const [atom, set] = AtomUtil.imperativeSetAtom(0)

		set(1)

		store.sub(atom, () => {
			expect(store.get(atom)).toEqual(1)
		})

		expect(store.get(atom)).toEqual(1)
	})
})
