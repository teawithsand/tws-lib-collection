/**
 * Application configuration interface
 */
export interface AppConfig extends Record<string, unknown> {
	/**
	 * Application theme preference
	 */
	theme: "light" | "dark" | "auto"

	/**
	 * Default language for the application
	 */
	language: string
}

/**
 * Default configuration values
 */
export const DEFAULT_APP_CONFIG: AppConfig = {
	theme: "auto",
	language: "en",
}
