import { type ComponentType, type ReactNode } from "react"

/**
 * Router type enum for different routing strategies
 */
export enum RouterType {
	BROWSER = "browser",
	HASH = "hash",
	MEMORY = "memory",
}

/**
 * Route content type enum
 */
export enum RouteContentType {
	COMPONENT = "component",
	ELEMENT = "element",
}

/**
 * Route content can be either a React component or a ReactNode
 */
export type RouteContent =
	| {
			readonly type: RouteContentType.COMPONENT
			readonly component: ComponentType
	  }
	| { readonly type: RouteContentType.ELEMENT; readonly element: ReactNode }

/**
 * Definition for a single route
 */
export interface RouteDefinition {
	readonly path: string
	readonly content: RouteContent
}

/**
 * Wrapper component that wraps Routes but can access router context
 */
export interface RouteWrapperComponent {
	readonly children: ReactNode
}

/**
 * Router configuration with routes and optional not found content
 */
export interface RouterConfigWithRoutes {
	readonly type?: RouterType
	readonly routes: readonly RouteDefinition[]
	readonly notFoundContent?: RouteContent
	readonly wrapperComponent?: ComponentType<RouteWrapperComponent>
	readonly content?: never
}

/**
 * Router configuration with content only (no routes or not found content)
 */
export interface RouterConfigWithContent {
	readonly type?: RouterType
	readonly content: ReactNode
	readonly wrapperComponent?: ComponentType<RouteWrapperComponent>
	readonly routes?: never
	readonly notFoundContent?: never
}

/**
 * Router configuration - either with routes or with content
 */
export type RouterConfig = RouterConfigWithRoutes | RouterConfigWithContent
