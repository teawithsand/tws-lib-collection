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
	 */
	public static readonly books: RouteConfig = {
		path: "/abooks",
		navigate: () => "/abooks",
	}

	/**
	 * Book preview page route
	 */
	public static readonly abookShow: RouteConfig = {
		path: "/abooks/:id",
		navigate: (id: string) => `/abooks/${id}`,
	}

	/**
	 * Add book page route
	 */
	public static readonly addBook: RouteConfig = {
		path: "/abooks/add",
		navigate: () => "/abooks/add",
	}

	/**
	 * Edit book page route
	 */
	public static readonly editBook: RouteConfig = {
		path: "/abooks/:id/edit",
		navigate: (id: string) => `/abooks/${id}/edit`,
	}

	/**
	 * Upload files to book page route
	 */
	public static readonly uploadFiles: RouteConfig = {
		path: "/abooks/:id/upload",
		navigate: (id: string) => `/abooks/${id}/upload`,
	}

	/**
	 * File list for book page route
	 */
	public static readonly fileList: RouteConfig = {
		path: "/abooks/:id/files",
		navigate: (id: string) => `/abooks/${id}/files`,
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
			Routes.addBook,
			Routes.editBook,
			Routes.uploadFiles,
			Routes.fileList,
			Routes.settings,
			Routes.storage,
		]
	}
}
