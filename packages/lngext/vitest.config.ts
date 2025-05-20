import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		coverage: {
			reporter: ["text", "json", "html", "lcov"],
			exclude: ["node_modules/", "test/"], 
			provider: "istanbul",
		},
		include: ["src/**/*.test.ts"],
		watch: false,
	},
})
