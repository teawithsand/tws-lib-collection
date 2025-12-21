import { describe, expect, test } from "vitest"

import { get42 } from "@teawithsand/rts-engine"

// Tests that's designed to ensure that WASM gets loaded and runs.
// That's what the get_42 function is for.
describe("wasm-load", () => {
	test("placeholder test", () => {
		expect(get42()).toEqual(42)
	})
})
