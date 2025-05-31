import { defineConfig } from "vitest/config"

export default defineConfig({
	optimizeDeps: {
		exclude: ['@sqlite.org/sqlite-wasm'],
	},
	server: {
		headers: {
			'Cross-Origin-Opener-Policy': 'same-origin',
			'Cross-Origin-Embedder-Policy': 'require-corp',
		},
		fs: {
			allow: [
				// Allow access to the entire monorepo root
				'../..',
				// Allow access to node_modules for SQLite WASM files
				'../../common/temp/node_modules',
			],
		},
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
