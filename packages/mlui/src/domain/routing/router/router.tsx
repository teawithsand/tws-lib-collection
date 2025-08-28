import { TypeAssert } from "@teawithsand/lngext"
import {
	BrowserRouter,
	HashRouter,
	MemoryRouter,
	Route,
	Routes,
} from "react-router"
import {
	RouteContentType,
	RouterType,
	type RouteContent,
	type RouterConfig,
	type RouterConfigWithContent,
	type RouterConfigWithRoutes,
} from "../defines"

type RouterComponentType =
	| typeof BrowserRouter
	| typeof HashRouter
	| typeof MemoryRouter

const isContentConfig = (
	config: RouterConfig,
): config is RouterConfigWithContent => {
	return "content" in config && config.content !== undefined
}

const isRoutesConfig = (
	config: RouterConfig,
): config is RouterConfigWithRoutes => {
	return "routes" in config && config.routes !== undefined
}

const renderRouteContent = (content: RouteContent) => {
	switch (content.type) {
		case RouteContentType.COMPONENT: {
			const Component = content.component
			return <Component />
		}
		case RouteContentType.ELEMENT:
			return content.element
	}
}

const getRouterComponent = (type: RouterType) => {
	switch (type) {
		case RouterType.HASH:
			return HashRouter
		case RouterType.MEMORY:
			return MemoryRouter
		case RouterType.BROWSER:
		default:
			return BrowserRouter
	}
}

const renderContentRouter = (
	config: RouterConfigWithContent,
	RouterComponent: RouterComponentType,
) => {
	const { wrapperComponent: WrapperComponent } = config
	return (
		<RouterComponent>
			{WrapperComponent ? (
				<WrapperComponent>{config.content}</WrapperComponent>
			) : (
				config.content
			)}
		</RouterComponent>
	)
}

const renderRoutesRouter = (
	config: RouterConfigWithRoutes,
	RouterComponent: RouterComponentType,
) => {
	const {
		routes,
		notFoundContent,
		wrapperComponent: WrapperComponent,
	} = config
	const routesElement = (
		<Routes>
			{routes.map((route, index) => (
				<Route
					key={index}
					path={route.path}
					element={renderRouteContent(route.content)}
				/>
			))}
			{notFoundContent && (
				<Route path="*" element={renderRouteContent(notFoundContent)} />
			)}
		</Routes>
	)

	return (
		<RouterComponent>
			{WrapperComponent ? (
				<WrapperComponent>{routesElement}</WrapperComponent>
			) : (
				routesElement
			)}
		</RouterComponent>
	)
}

/**
 * Router component implementation using react-router
 */
export const Router = (config: RouterConfig) => {
	const { type = RouterType.BROWSER } = config
	const RouterComponent = getRouterComponent(type)

	if (isContentConfig(config)) {
		return renderContentRouter(config, RouterComponent)
	}

	if (isRoutesConfig(config)) {
		return renderRoutesRouter(config, RouterComponent)
	}

	return TypeAssert.unreachable(
		"Router configuration must have either 'content' or 'routes'",
	)
}
