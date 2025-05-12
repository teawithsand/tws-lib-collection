import tsParser from "@typescript-eslint/parser"
import valtio from "eslint-plugin-valtio"
import { defineConfig, globalIgnores } from "eslint/config"
import globals from "globals"
import tseslint from "typescript-eslint"

export default defineConfig([
	globalIgnores(["*.js", "**/*.test.ts"]),
	{
		files: ["src/**/*.{js,mjs,cjs,ts}"],
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
	},
	tseslint.configs.recommended,
	valtio.configs["flat/recommended"],
	{
		rules: {
			"valtio/state-snapshot-rule": ["warn"],
			"valtio/avoid-this-in-proxy": ["warn"],
		},
	},
	{
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: ["./tsconfig.json"],
				projectService: {
					allowDefaultProject: ["*.js", "*.mjs", "./*.ts"],
				},
			},
		},
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{
					args: "all",
					argsIgnorePattern: "^_",
					caughtErrors: "all",
					caughtErrorsIgnorePattern: "^_",
					destructuredArrayIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					ignoreRestSiblings: true,
				},
			],
			"@typescript-eslint/no-floating-promises": "warn",
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-empty-object-type": "off",
			"@typescript-eslint/naming-convention": [
				"error",
				{
					selector: "variable",
					format: ["camelCase", "PascalCase", "UPPER_CASE"],
					leadingUnderscore: "allow",
				},
				{
					selector: "function",
					format: ["camelCase", "PascalCase"],
				},
				{
					selector: "typeLike",
					format: ["PascalCase"],
				},
			],
		},
	},
])
