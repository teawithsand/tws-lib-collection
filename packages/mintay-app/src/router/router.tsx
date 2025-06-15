import { BrowserRouter, Route, Routes } from "react-router"
import { Home, NotFound } from "../pages"
import { Routes as AppRoutes } from "./routes"

/**
 * Main application component with routing setup
 */
export const Router = () => {
	return (
		<BrowserRouter>
			<Routes>
				<Route path={AppRoutes.home.path} element={<Home />} />
				<Route path={"*"} element={<NotFound />} />
			</Routes>
		</BrowserRouter>
	)
}
