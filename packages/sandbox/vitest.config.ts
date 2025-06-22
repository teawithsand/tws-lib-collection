import { defineConfig } from "vitest/config"

export default defineConfig({
	
	test: {
		globals: true,
		environment: "jsdom",
		server: {
			debug: {
				loadDumppedModules: true,
			},
			deps: {
				
				external: ["node_modules", "@teawithsand/fstate"],
				fallbackCJS: true
			}
		},
		coverage: {
			reporter: ["text", "json", "html", "lcov"],
			exclude: ["node_modules/", "test/"],
			provider: "istanbul",
		},
		watch: false,
	},
})
