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
	 * Books page route
	 * NOTE: Currently unused (no page component implemented and not wired in router)
	 */
	public static readonly books: RouteConfig = {
		path: "/abooks",
		navigate: () => "/abooks",
	}

	/**
	 * Audiobook show page route
	 */
	public static readonly abookShow: RouteConfig = {
		path: "/abooks/:id/show",
		navigate: (id: string) => `/abooks/${id}/show`,
	}

	public static readonly createAbook: RouteConfig = {
		path: "/abooks/create",
		navigate: () => "/abooks/create",
	}

	/**
	 * Audiobook list page route
	 */
	public static readonly listAbooks: RouteConfig = {
		path: "/abooks",
		navigate: () => "/abooks",
	}

	/**
	 * Edit book page route
	 * NOTE: Currently unused (no page component implemented and not wired in router)
	 */
	public static readonly editBook: RouteConfig = {
		path: "/abooks/:id/edit",
		navigate: (id: string) => `/abooks/${id}/edit`,
	}

	/**
	 * Upload files to book page route
	 * NOTE: Currently unused (no page component implemented and not wired in router)
	 */
	public static readonly uploadFiles: RouteConfig = {
		path: "/abooks/:id/upload",
		navigate: (id: string) => `/abooks/${id}/upload`,
	}

	/**
	 * File list for book page route
	 * NOTE: Currently unused (no page component implemented and not wired in router)
	 */
	public static readonly fileList: RouteConfig = {
		path: "/abooks/:id/files",
		navigate: (id: string) => `/abooks/${id}/files`,
	}

	/**
	 * Entry show page route
	 * NOTE: Currently unused (no page component implemented and not wired in router)
	 */
	public static readonly entryShow: RouteConfig = {
		path: "/abooks/:abookId/entries/:entryId",
		navigate: (abookId: string, entryId: string) =>
			`/abooks/${abookId}/entries/${entryId}`,
	}

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
	 * Get all available routes
	 */
	public static readonly getAllRoutes = (): RouteConfig[] => {
		return [
			Routes.home,
			Routes.about,
			Routes.books,
			Routes.abookShow,
			Routes.createAbook,
			Routes.listAbooks,
			Routes.editBook,
			Routes.uploadFiles,
			Routes.fileList,
			Routes.entryShow,
			Routes.settings,
			Routes.storage,
		]
	}
}
