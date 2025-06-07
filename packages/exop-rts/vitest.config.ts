import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		coverage: {
			reporter: ["text", "json", "html", "lcov"], // Generate coverage reports
			exclude: ["node_modules/", "test/"], // Exclude these folders from coverage
			provider: "istanbul",
		},
		include: ["src/**/*.test.ts"], // Pattern to find test files
		watch: false,
	},
})
