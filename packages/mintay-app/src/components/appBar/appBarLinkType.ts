/**
 * Enum defining the type of link for AppBar items
 */
export enum AppBarLinkType {
	/**
	 * Not a link - only onClick handler will be used
	 */
	NO_LINK = 1,

	/**
	 * Local link within the application - uses React Router navigation
	 */
	LOCAL_LINK = 2,

	/**
	 * Remote link to external site - uses anchor HTML element
	 */
	REMOTE_LINK = 3,
}
