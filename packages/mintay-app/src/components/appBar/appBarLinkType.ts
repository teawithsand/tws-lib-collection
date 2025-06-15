/**
 * Enum defining the type of link for AppBar items
 */
export enum AppBarLinkType {
	/**
	 * Not a link - only onClick handler will be used
	 */
	NO_LINK,

	/**
	 * Local link within the application - uses React Router navigation
	 */
	LOCAL_LINK,

	/**
	 * Remote link to external site - uses anchor HTML element
	 */
	REMOTE_LINK,
}
