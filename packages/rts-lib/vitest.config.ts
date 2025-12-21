import { defineConfig } from "vitest/config";
import wasm from "vite-plugin-wasm";

export default defineConfig({
	plugins: [wasm()],
	test: {
		globals: true,
		environment: "node",
		coverage: {
			reporter: ["text", "json", "html", "lcov"],
			exclude: ["node_modules/", "test/"],
			provider: "istanbul",
		},
		include: ["src/**/*.test.ts"],
		watch: false,
	},
})
