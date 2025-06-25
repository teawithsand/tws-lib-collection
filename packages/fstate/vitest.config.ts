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
		include: [],
		watch: false,
		projects: [
			{
				test: {
					include: ["src/**/*.spec.ts"],
					browser: {
						enabled: true,
						provider: "playwright",
						isolate: true,
						instances: [
							// { browser: "chromium", headless: true },
							{ browser: "firefox", headless: true },
						],
					},
				},
			},
			{
				test: {
					include: ["src/**/*.test.ts"],
				},
			},
		],
	},
})
