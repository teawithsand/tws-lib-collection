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
	 * Collection detail page route
	 */
	public static readonly collectionDetail: RouteConfig = {
		path: "/collections/:id",
		navigate: (id: string) => `/collections/${id}`,
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
	 * Login page route
	 */
	public static readonly login: RouteConfig = {
		path: "/auth/login",
		navigate: () => "/auth/login",
	}

	/**
	 * Register page route
	 */
	public static readonly register: RouteConfig = {
		path: "/auth/register",
		navigate: () => "/auth/register",
	}

	/**
	 * Get all available routes
	 */
	public static readonly getAllRoutes = (): RouteConfig[] => {
		return [
			Routes.home,
			Routes.about,
			Routes.collections,
			Routes.collectionDetail,
			Routes.createCollection,
			Routes.editCollection,
			Routes.login,
			Routes.register,
		]
	}
}
