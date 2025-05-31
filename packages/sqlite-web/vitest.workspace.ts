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
				// https://vitest.dev/guide/browser/playwright
				instances: [
					{ browser: "chromium", headless: true, isolate: true },
					{ browser: "firefox", headless: true, isolate: true },
					// { browser: "webkit", headless: true, isolate: true }, // No OPFS there
				],
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
