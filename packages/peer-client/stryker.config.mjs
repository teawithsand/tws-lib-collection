// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
	packageManager: "npm",
	reporters: ["html", "clear-text", "progress"],
	testRunner: "vitest",
	plugins: ['@stryker-mutator/vitest-runner'],
	coverageAnalysis: "perTest",
	mutate: [
		
	],
}
export default config
