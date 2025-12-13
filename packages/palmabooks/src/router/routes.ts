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
		path: "/abooks/:id/show",
		navigate: (id: string) => `/abooks/${id}/show`,
	}

	// ===== NOT IMPLEMENTED IN MVP =====
	// Uncomment these when implementing the features

	// /**
	//  * Edit audiobook page route
	//  */
	// public static readonly editBook: RouteConfig = {
	// 	path: "/abooks/:id/edit",
	// 	navigate: (id: string) => `/abooks/${id}/edit`,
	// }

	// /**
	//  * Upload files to existing audiobook page route
	//  */
	// public static readonly uploadFiles: RouteConfig = {
	// 	path: "/abooks/:id/upload",
	// 	navigate: (id: string) => `/abooks/${id}/upload`,
	// }

	// /**
	//  * File list for audiobook page route
	//  */
	// public static readonly fileList: RouteConfig = {
	// 	path: "/abooks/:id/files",
	// 	navigate: (id: string) => `/abooks/${id}/files`,
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
			Routes.settings,
			Routes.storage,
		]
	}
}
