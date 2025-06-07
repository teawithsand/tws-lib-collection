// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
	packageManager: "npm",
	reporters: ["html", "clear-text", "progress"],
	testRunner: "vitest",
	coverageAnalysis: "perTest",
	mutate: [
		"src/cardStore/inMemory/*.ts",
		"src/cardStore/drizzle/*.ts",
		"src/defines/card/stored/*/serializer.ts",
		"src/engineStore/drizzle.ts",
		"src/engineStore/inMemory.ts",
	],
}
export default config
