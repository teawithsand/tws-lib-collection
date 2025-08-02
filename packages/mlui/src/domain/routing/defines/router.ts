import { type ComponentType, type ReactNode } from "react"

/**
 * Router type enum for different routing strategies
 */
export enum RouterType {
	Browser = "browser",
	Hash = "hash",
}

/**
 * Route content type enum
 */
export enum RouteContentType {
	Component = "component",
	Element = "element",
}

/**
 * Route content can be either a React component or a ReactNode
 */
export type RouteContent =
	| {
			readonly type: RouteContentType.Component
			readonly component: ComponentType
	  }
	| { readonly type: RouteContentType.Element; readonly element: ReactNode }

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
 * Router configuration
 */
export interface RouterConfig {
	readonly type?: RouterType
	readonly routes: readonly RouteDefinition[]
	readonly notFoundContent?: RouteContent
	readonly wrapperComponent?: ComponentType<RouteWrapperComponent>
}
