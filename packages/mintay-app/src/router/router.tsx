import { BrowserRouter, Route, Routes } from "react-router"
import { GlobalLayout } from "../components/layout"
import { About, Home, NotFound } from "../pages"
import { Routes as AppRoutes } from "./routes"

/**
 * Main application component with routing setup
 */
export const Router = () => {
	return (
		<BrowserRouter>
			<GlobalLayout>
				<Routes>
					<Route path={AppRoutes.home.path} element={<Home />} />
					<Route path={AppRoutes.about.path} element={<About />} />
					<Route path={"*"} element={<NotFound />} />
				</Routes>
			</GlobalLayout>
		</BrowserRouter>
	)
}
