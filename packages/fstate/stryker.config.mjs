// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
	packageManager: "npm",
	reporters: ["html", "clear-text", "progress", "json"],
	testRunner: "vitest",
	plugins: ["@stryker-mutator/vitest-runner"],
	coverageAnalysis: "perTest",
	mutate: [
		"src/fs/inMemory/inMemoryFileHandle.ts",
		"src/fs/inMemory/inMemoryDirHandle.ts",
		"src/fs/inMemory/inMemoryFs.ts",
		"src/fs/inMemory/inMemoryFsWriter.ts",
	],
}
export default config
