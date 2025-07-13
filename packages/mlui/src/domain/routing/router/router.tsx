import { BrowserRouter, HashRouter, Route, Routes } from "react-router"
import {
	RouteContentType,
	RouterType,
	type RouteContent,
	type RouterConfig,
} from "../defines"

/**
 * Helper function to render route content based on type
 */
const renderRouteContent = (content: RouteContent) => {
	switch (content.type) {
		case RouteContentType.Component: {
			const Component = content.component
			return <Component />
		}
		case RouteContentType.Element:
			return content.element
	}
}

/**
 * Router component implementation using react-router
 */
export const Router = ({
	type = RouterType.Browser,
	routes,
	notFoundContent,
}: RouterConfig) => {
	const RouterComponent =
		type === RouterType.Hash ? HashRouter : BrowserRouter

	return (
		<RouterComponent>
			<Routes>
				{routes.map((route, index) => (
					<Route
						key={index}
						path={route.path}
						element={renderRouteContent(route.content)}
					/>
				))}
				{notFoundContent && (
					<Route
						path="*"
						element={renderRouteContent(notFoundContent)}
					/>
				)}
			</Routes>
		</RouterComponent>
	)
}
