import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		dts({
			include: ['src/**/*'],
			exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/**/*.test.tsx', 'src/**/*.spec.tsx'],
			outDir: 'dist',
			insertTypesEntry: true,
			tsconfigPath: './tsconfig.lib.json'
		})
	],
	resolve: {
		alias: {
			"@": resolve(__dirname, "src"),
			'@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
		}
	},
	build: {
		lib: {
			name: "mlui",
			entry: resolve(__dirname, 'src', 'index.ts'),
			fileName: 'index',
			formats: ['es'],
		},
		rollupOptions: {
			external: ['react'],
			output: {
				globals: {
					react: 'React'
				}
			}
		},
		sourcemap: true,
		emptyOutDir: true,
	}
})
