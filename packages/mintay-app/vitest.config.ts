import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./vitest.setup.mjs"],
		coverage: {
			reporter: ["text", "json", "html", "lcov"],
			exclude: ["node_modules/", "test/"], 
			provider: "istanbul",
		},
		include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
		watch: false,
	},
})
