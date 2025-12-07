import { defineConfig } from "vitest/config"
import { resolve } from "node:path"

const commonTestConfig = {
	globals: true,
	environment: "jsdom",
	setupFiles: ["./vitest.setup.ts"],
	coverage: {
		reporter: ["text", "json", "html", "lcov"],
		exclude: ["node_modules/", "test/"],
		provider: "istanbul",
	},
	watch: false,
}

export default defineConfig({
	resolve: {
		alias: {
			"@": resolve(__dirname, "src"),
		},
	},
	test: {
		projects: [
			{
				test: {
					...commonTestConfig,
					include: ["src/**/*.spec.ts", "src/**/*.spec.tsx"],
					browser: {
						enabled: true,
						provider: "playwright",
						instances: [
							{ browser: "chromium", headless: true },
							{ browser: "firefox", headless: true },
						],
					},
				},
			},
			{
				test: {
					...commonTestConfig,
					include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
				},
			},
		],
	},
})
