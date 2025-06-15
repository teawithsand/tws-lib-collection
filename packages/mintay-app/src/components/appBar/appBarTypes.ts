import { ComponentType } from "react"
import { AppBarLinkType } from "./appBarLinkType"

interface BaseAppBarItem {
	readonly label: string
	readonly onClick?: () => void
	readonly disabled?: boolean
}

type AppBarItemWithNoLink = BaseAppBarItem & {
	readonly linkType?: AppBarLinkType.NO_LINK | undefined
	readonly href?: never
}

type AppBarItemWithLocalLink = BaseAppBarItem & {
	readonly linkType: AppBarLinkType.LOCAL_LINK
	readonly href: string
}

type AppBarItemWithRemoteLink = BaseAppBarItem & {
	readonly linkType: AppBarLinkType.REMOTE_LINK
	readonly href: string
}

export type AppBarAction = (
	| AppBarItemWithNoLink
	| AppBarItemWithLocalLink
	| AppBarItemWithRemoteLink
) & {
	readonly icon?: ComponentType<{ size?: number }>
}

export type AppBarMoreAction = (
	| AppBarItemWithNoLink
	| AppBarItemWithLocalLink
	| AppBarItemWithRemoteLink
) & {
	readonly icon?: ComponentType<{ size?: number }>
}

export type AppBarDrawerItem = (
	| AppBarItemWithNoLink
	| AppBarItemWithLocalLink
	| AppBarItemWithRemoteLink
) & {
	readonly icon: ComponentType<{ size?: number }>
}
