import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'
import { copyFileSync, existsSync } from 'node:fs'

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		dts({
			include: ['src/**/*'],
			exclude: [
				'src/**/*.test.ts', 
				'src/**/*.spec.ts', 
				'src/**/*.test.tsx', 
				'src/**/*.spec.tsx',
				'src/mainDemo.tsx',
				'src/internalDemo/**/*'
			],
			outDir: 'dist',
			insertTypesEntry: true,
			tsconfigPath: './tsconfig.lib.json'
		}),
		// Custom plugin to copy only _mantine.scss to dist
		{
			name: 'copy-mantine-scss',
			writeBundle() {
				const srcFile = resolve(__dirname, 'src/_mantine.scss')
				const distFile = resolve(__dirname, 'dist/_mantine.scss')
				
				if (existsSync(srcFile)) {
					copyFileSync(srcFile, distFile)
				}
			}
		},
		// Custom plugin to exclude demo files from build
		{
			name: 'exclude-demo-files',
			resolveId(id) {
				// Skip demo files during module resolution
				if (id.includes('mainDemo.tsx') || id.includes('internalDemo/')) {
					return { id, external: true }
				}
				return null
			}
		},
	],
	resolve: {
		alias: {
			"@": resolve(__dirname, "src"),
			'@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
		}
	},
	css: {
		preprocessorOptions: {
			scss: {
				api: 'modern-compiler',
				additionalData: (content, filename) => {
					if (filename.includes('_mantine.scss')) {
						return content;
					}
					return `@use "${resolve(__dirname, 'src/_mantine')}" as mantine;\n${content}`;
				},
			},
		},
	},
	build: {
		lib: {
			name: "mlui",
			entry: resolve(__dirname, 'src', 'index.ts'),
			fileName: 'index',
			formats: ['es'],
		},
		rollupOptions: {
			external: [
				'react', 
				'react-dom',
				'react-router',
				'react/jsx-runtime',
				/@mantine\/.*/,
				/@tabler\/icons-react/,
				/@teawithsand\/.*/
			],
			output: {
				globals: {
					react: 'React',
					'react-dom': 'ReactDOM'
				},
				// Preserve readable formatting and prevent bundling
				compact: false,
				preserveModules: true,
				preserveModulesRoot: 'src',
				// Generate meaningful file names based on original structure
				entryFileNames: (chunkInfo) => {
					const name = chunkInfo.name
					if (name === 'index') {
						return 'index.js'
					}
					return `${name}.js`
				},
				chunkFileNames: (chunkInfo) => {
					// Use the original file path structure
					if (chunkInfo.facadeModuleId) {
						const path = chunkInfo.facadeModuleId
							.replace(/.*\/src\//, '')
							.replace(/\.(ts|tsx)$/, '')
						return `${path}.js`
					}
					return '[name].js'
				}
			}
		},
		sourcemap: true,
		emptyOutDir: true,
		// Whether all CSS files should be split into multiple files
		cssCodeSplit: false,
		// Disable minification and optimization. Target bundler will do that.
		minify: false,
		target: 'esnext',
	}
})
