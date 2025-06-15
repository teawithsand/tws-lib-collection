/**
 * Route configuration interface
 */
interface RouteConfig {
	readonly path: string
	readonly navigate: (...params: string[]) => string
}

/**
 * Router class for managing application routes
 * Provides centralized route definitions and navigation helpers
 */
export class Routes {
	private constructor() {}

	/**
	 * Home page route
	 */
	public static readonly home: RouteConfig = {
		path: "/",
		navigate: () => "/",
	}

	/**
	 * About page route
	 */
	public static readonly about: RouteConfig = {
		path: "/about",
		navigate: () => "/about",
	}

	/**
	 * Get all available routes
	 */
	public static readonly getAllRoutes = (): RouteConfig[] => {
		return [Routes.home, Routes.about]
	}
}
