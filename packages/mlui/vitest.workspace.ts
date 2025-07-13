import { defineWorkspace } from "vitest/config"
import { resolve } from "node:path"
import react from '@vitejs/plugin-react-swc'

export default defineWorkspace([
	{
		plugins: [react()],
		resolve: {
			alias: {
				"@": resolve(__dirname, "src"),
			},
		},
		test: {
			name: "jsdom",
			globals: true,
			environment: "jsdom",
			setupFiles: ["./vitest.setup.mjs"],
			include: ["src/**/*.spec.ts", "src/**/*.spec.tsx"],
		},
	},
	{
		plugins: [react()],
		resolve: {
			alias: {
				"@": resolve(__dirname, "src"),
			},
		},
		test: {
			name: "node",
			globals: true,
			environment: "node",
			include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
		},
	},
])
