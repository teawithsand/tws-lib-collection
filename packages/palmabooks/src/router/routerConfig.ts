import {
	AbooksPage,
	AboutPage,
	CategoriesPage,
	CreateAbookPage,
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
		path: Routes.books.path,
		content: {
			type: RouteContentType.Component,
			component: AbooksPage,
		},
	},
	{
		path: Routes.addBook.path,
		content: {
			type: RouteContentType.Component,
			component: CreateAbookPage,
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
