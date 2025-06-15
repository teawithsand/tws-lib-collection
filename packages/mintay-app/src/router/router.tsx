import { BrowserRouter, Route, Routes } from "react-router"
import { GlobalLayout } from "../components/layout"
import { AboutPage, CollectionListPage, HomePage, NotFoundPage } from "../pages"
import { Routes as AppRoutes } from "./routes"

export const Router = () => {
	return (
		<BrowserRouter>
			<GlobalLayout>
				<Routes>
					<Route path={AppRoutes.home.path} element={<HomePage />} />
					<Route
						path={AppRoutes.about.path}
						element={<AboutPage />}
					/>
					<Route
						path={AppRoutes.collections.path}
						element={<CollectionListPage />}
					/>
					<Route path={"*"} element={<NotFoundPage />} />
				</Routes>
			</GlobalLayout>
		</BrowserRouter>
	)
}
