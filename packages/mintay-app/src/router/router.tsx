import { BrowserRouter, Route, Routes } from "react-router"
import { GlobalLayout } from "../components/layout"
import {
	AboutPage,
	CardDetailPage,
	CollectionCardCreatePage,
	CollectionCardEditPage,
	CollectionCardsPage,
	CollectionCreatePage,
	CollectionDetailPage,
	CollectionEditPage,
	CollectionLearnPage,
	CollectionListPage,
	HomePage,
	NotFoundPage,
	UserLoginPage,
	UserProfilePage,
	UserRegisterPage,
} from "../pages"
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
					<Route
						path={AppRoutes.collectionDetail.path}
						element={<CollectionDetailPage />}
					/>
					<Route
						path={AppRoutes.collectionCards.path}
						element={<CollectionCardsPage />}
					/>
					<Route
						path={AppRoutes.collectionLearn.path}
						element={<CollectionLearnPage />}
					/>
					<Route
						path={AppRoutes.cardDetail.path}
						element={<CardDetailPage />}
					/>
					<Route
						path={AppRoutes.createCollectionCard.path}
						element={<CollectionCardCreatePage />}
					/>
					<Route
						path={AppRoutes.editCollectionCard.path}
						element={<CollectionCardEditPage />}
					/>
					<Route
						path={AppRoutes.createCollection.path}
						element={<CollectionCreatePage />}
					/>
					<Route
						path={AppRoutes.editCollection.path}
						element={<CollectionEditPage />}
					/>
					<Route
						path={AppRoutes.login.path}
						element={<UserLoginPage />}
					/>
					<Route
						path={AppRoutes.register.path}
						element={<UserRegisterPage />}
					/>
					<Route
						path={AppRoutes.profile.path}
						element={<UserProfilePage />}
					/>
					<Route path={"*"} element={<NotFoundPage />} />
				</Routes>
			</GlobalLayout>
		</BrowserRouter>
	)
}
