import { defineWorkspace } from "vitest/config"

export default defineWorkspace([
	{
		test: {
			name: "jsdom",
			globals: true,
			environment: "jsdom",
			setupFiles: ["./vitest.setup.mjs"],
			include: ["src/**/*.spec.ts", "src/**/*.spec.tsx"],
		},
	},
	{
		test: {
			name: "node",
			globals: true,
			environment: "node",
			include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
		},
	},
])
