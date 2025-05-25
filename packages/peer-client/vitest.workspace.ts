import { defineWorkspace } from "vitest/config"

export default defineWorkspace([
	// If you want to keep running your existing tests in Node.js, uncomment the next line.
	// 'vitest.config.ts',
	{
		extends: "vitest.config.ts",
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
		extends: "vitest.config.ts",
		test: {
			include: [
				"src/**/*.test.ts",
			],
		},
	},
])
