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
	 * Collection cards page route
	 */
	public static readonly collectionCards: RouteConfig = {
		path: "/collections/:id/cards",
		navigate: (id: string) => `/collections/${id}/cards`,
	}

	/**
	 * Create card in collection page route
	 */
	public static readonly createCollectionCard: RouteConfig = {
		path: "/collections/:id/cards/create",
		navigate: (id: string) => `/collections/${id}/cards/create`,
	}

	/**
	 * Edit card in collection page route
	 */
	public static readonly editCollectionCard: RouteConfig = {
		path: "/collections/:id/cards/:cardId/edit",
		navigate: (id: string, cardId: string) =>
			`/collections/${id}/cards/${cardId}/edit`,
	}

	/**
	 * Card detail page route
	 */
	public static readonly cardDetail: RouteConfig = {
		path: "/collections/:id/cards/:cardId",
		navigate: (id: string, cardId: string) =>
			`/collections/${id}/cards/${cardId}`,
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
			Routes.collectionCards,
			Routes.cardDetail,
			Routes.createCollectionCard,
			Routes.editCollectionCard,
			Routes.createCollection,
			Routes.editCollection,
			Routes.login,
			Routes.register,
		]
	}
}
