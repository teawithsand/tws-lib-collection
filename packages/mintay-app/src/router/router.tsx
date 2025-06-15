import { BrowserRouter, Route, Routes } from "react-router"
import { Layout } from "../components/layout"
import { About, Home, NotFound } from "../pages"
import { Routes as AppRoutes } from "./routes"

/**
 * Main application component with routing setup
 */
export const Router = () => {
	return (
		<BrowserRouter>
			<Layout>
				<Routes>
					<Route path={AppRoutes.home.path} element={<Home />} />
					<Route path={AppRoutes.about.path} element={<About />} />
					<Route path={"*"} element={<NotFound />} />
				</Routes>
			</Layout>
		</BrowserRouter>
	)
}
