import { defineWorkspace } from "vitest/config"

export default defineWorkspace([
	{
		extends: "vitest.config.ts",
		test: {
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
		extends: "vitest.config.ts",
		test: {
			include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
		},
	},
])
