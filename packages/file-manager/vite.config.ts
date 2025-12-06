import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

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
			],
			outDir: 'dist',
			insertTypesEntry: true,
			tsconfigPath: './tsconfig.lib.json'
		}),
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
			},
		},
	},
	build: {
		lib: {
			name: "file-manager",
			entry: resolve(__dirname, 'src', 'index.ts'),
			fileName: 'index',
			formats: ['es'],
		},
		rollupOptions: {
			external: [
				'react', 
				'react-dom',
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
				compact: false,
				preserveModules: true,
				preserveModulesRoot: 'src',
			}
		}
	}
})
