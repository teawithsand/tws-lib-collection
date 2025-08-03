import {
	AbookCreatePage,
	AbookListPage,
	AbookShowPage,
	AboutPage,
	CategoriesPage,
	HomePage,
	NotFoundPage,
	SettingsPage,
} from "@/pages"
import { RouteContentType, RouteDefinition } from "@teawithsand/mlui"
import { Routes } from "./routes"

const routes: RouteDefinition[] = [
	{
		path: Routes.home.path,
		content: {
			type: RouteContentType.Component,
			component: HomePage,
		},
	},
	{
		path: Routes.about.path,
		content: {
			type: RouteContentType.Component,
			component: AboutPage,
		},
	},
	{
		path: Routes.abookShow.path,
		content: {
			type: RouteContentType.Component,
			component: AbookShowPage,
		},
	},
	{
		path: Routes.books.path,
		content: {
			type: RouteContentType.Component,
			component: AbookListPage,
		},
	},
	{
		path: Routes.addBook.path,
		content: {
			type: RouteContentType.Component,
			component: AbookCreatePage,
		},
	},
	{
		path: Routes.categories.path,
		content: {
			type: RouteContentType.Component,
			component: CategoriesPage,
		},
	},
	{
		path: Routes.settings.path,
		content: {
			type: RouteContentType.Component,
			component: SettingsPage,
		},
	},
]

const notFoundContent = {
	type: RouteContentType.Component,
	component: NotFoundPage,
} as const

export const RouterConfig = Object.freeze({
	routes,
	notFoundContent,
})
