import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		globals: true,
		environment: "jsdom",
		coverage: {
			reporter: ["text", "json", "html", "lcov"],
			exclude: ["node_modules/", "test/"],
			provider: "istanbul",
		},
		watch: false,
		projects: [
			{
				test: {
					include: [
						"src/**/*.spec.ts",
					],
					browser: {
						enabled: true,
						provider: "playwright",
						instances: [
							{ browser: "firefox", isolate: true, headless: true },
							{ browser: "chromium", isolate: true, headless: true },
							{ browser: "webkit", isolate: true, headless: true },
						]
					},
				},
			},
			{
				test: {
					include: [
						"src/**/*.test.ts",
					],
				},
			},
		],
	},
})
