import { defineConfig } from "vitest/config"
import { resolve } from "node:path"

export default defineConfig({
	resolve: {
		alias: {
			"@": resolve(__dirname, "src"),
		},
	},
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./vitest.setup.mjs"],
		coverage: {
			reporter: ["text", "json", "html", "lcov"],
			exclude: ["node_modules/", "test/"], 
			provider: "istanbul",
		},
		watch: false,
	},
})
