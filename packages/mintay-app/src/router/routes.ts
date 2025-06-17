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
	 * Collections page route
	 */
	public static readonly collections: RouteConfig = {
		path: "/collections",
		navigate: () => "/collections",
	}

	/**
	 * Create collection page route
	 */
	public static readonly createCollection: RouteConfig = {
		path: "/collections/create",
		navigate: () => "/collections/create",
	}

	/**
	 * Edit collection page route
	 */
	public static readonly editCollection: RouteConfig = {
		path: "/collections/:id/edit",
		navigate: (id: string) => `/collections/${id}/edit`,
	}

	/**
	 * Get all available routes
	 */
	public static readonly getAllRoutes = (): RouteConfig[] => {
		return [
			Routes.home,
			Routes.about,
			Routes.collections,
			Routes.createCollection,
			Routes.editCollection,
		]
	}
}
