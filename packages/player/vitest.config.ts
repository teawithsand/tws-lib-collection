import { defineConfig } from "vitest/config"
import path from 'path'

export default defineConfig({
	server: {
		fs: {
			// allow: [path.resolve(__dirname, '..')],
		}
	},
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
