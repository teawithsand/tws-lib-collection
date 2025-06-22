import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		globals: true,
		browser: {
			enabled: true,
			name: "chromium",
			provider: "playwright",
			headless: true,
		},
		include: ["**/*.spec.ts"],
		server: {
			deps: {
				external: ["node_modules"],
				fallbackCJS: true
			}
		},
		coverage: {
			reporter: ["text", "json", "html", "lcov"],
			exclude: ["node_modules/", "test/"],
			provider: "istanbul",
		},
		watch: false,
	},
})
