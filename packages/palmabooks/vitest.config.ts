import { defineConfig } from "vitest/config"
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		environment: "jsdom",
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
					setupFiles: ["./vitest.setup.mjs"],
					include: ["src/**/*.test.ts"],
				},
			},
		],
	},
})
