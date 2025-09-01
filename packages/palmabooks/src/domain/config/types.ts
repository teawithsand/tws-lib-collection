/**
 * Application configuration interface
 */
export interface AppConfig extends Record<string, unknown> {
	/**
	 * Default language for the application
	 */
	language: string
}

/**
 * Default configuration values
 */
export const DEFAULT_APP_CONFIG: AppConfig = {
	language: "en",
}
