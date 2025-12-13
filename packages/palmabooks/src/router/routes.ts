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
	 * Audiobook list page route (main feature)
	 */
	public static readonly listAbooks: RouteConfig = {
		path: "/abooks",
		navigate: () => "/abooks",
	}

	/**
	 * Create new audiobook page route
	 */
	public static readonly createAbook: RouteConfig = {
		path: "/abooks/create",
		navigate: () => "/abooks/create",
	}

	/**
	 * Audiobook details page route
	 */
	public static readonly abookShow: RouteConfig = {
		path: "/abook/:id/show",
		navigate: (id: string) => `/abook/${id}/show`,
	}

	/**
	 * Edit audiobook page route
	 */
	public static readonly abookEdit: RouteConfig = {
		path: "/abook/:id/edit",
		navigate: (id: string) => `/abook/${id}/edit`,
	}

	/**
	 * Entries list for audiobook page route
	 */
	public static readonly abookEntries: RouteConfig = {
		path: "/abook/:id/entries",
		navigate: (id: string) => `/abook/${id}/entries`,
	}

	// ===== NOT IMPLEMENTED IN MVP =====
	// Uncomment these when implementing the features

	// /**
	//  * Upload files to existing audiobook page route
	//  */
	// public static readonly uploadFiles: RouteConfig = {
	// 	path: "/abooks/:id/upload",
	// 	navigate: (id: string) => `/abooks/${id}/upload`,
	// }

	// /**
	//  * Entry/chapter show page route
	//  */
	// public static readonly entryShow: RouteConfig = {
	// 	path: "/abooks/:abookId/entries/:entryId",
	// 	navigate: (abookId: string, entryId: string) =>
	// 		`/abooks/${abookId}/entries/${entryId}`,
	// }

	/**
	 * Settings page route
	 */
	public static readonly settings: RouteConfig = {
		path: "/settings",
		navigate: () => "/settings",
	}

	/**
	 * Storage page route
	 */
	public static readonly storage: RouteConfig = {
		path: "/storage",
		navigate: () => "/storage",
	}

	/**
	 * Get all available routes for MVP
	 */
	public static readonly getAllRoutes = (): RouteConfig[] => {
		return [
			Routes.home,
			Routes.about,
			Routes.listAbooks,
			Routes.createAbook,
			Routes.abookShow,
			Routes.abookEdit,
			Routes.abookEntries,
			Routes.settings,
			Routes.storage,
		]
	}
}
