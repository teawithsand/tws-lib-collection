// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
	packageManager: "npm",
	reporters: ["html", "clear-text", "progress"],
	testRunner: "vitest",
	coverageAnalysis: "perTest",
	mutate: [
		"src/engineStore/inMemory.ts",
		"src/cardStore/inMemory.ts",
		"src/defines/card/stored/data/serializer.ts",
		"src/defines/card/stored/state/serializer.ts",
		"src/defines/card/stored/event/serializer.ts",
		"src/defines/card/stored/collection/serializer.ts",
		"src/cardStore/drizzle.ts",
		"src/engineStore/drizzle.ts",
	],
}
export default config
