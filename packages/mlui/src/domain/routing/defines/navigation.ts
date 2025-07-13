/**
 * Navigation hook interface for programmatic navigation
 */
export interface NavigationHook {
	/**
	 * Navigate to a specific path
	 * @param to - The path to navigate to
	 * @param options - Navigation options
	 */
	readonly navigate: (to: string, options?: NavigationOptions) => void

	/**
	 * Navigate back to the previous page
	 */
	readonly navigateBack: () => void
}

/**
 * Options for navigation
 */
export interface NavigationOptions {
	readonly replace?: boolean
	readonly state?: unknown
}
