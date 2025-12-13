import {
	AbookCreatePage,
	AbookEditPage,
	AbookEntriesPage,
	AbookListPage,
	AbookShowPage,
	AboutPage,
	HomePage,
	NotFoundPage,
	SettingsPage,
	StoragePage,
} from "@/pages"
import { RouteContentType, RouteDefinition } from "@teawithsand/mlui"
import { Routes } from "./routes"

const routes: RouteDefinition[] = [
	{
		path: Routes.home.path,
		content: {
			type: RouteContentType.COMPONENT,
			component: HomePage,
		},
	},
	{
		path: Routes.listAbooks.path,
		content: {
			type: RouteContentType.COMPONENT,
			component: AbookListPage,
		},
	},
	{
		path: Routes.createAbook.path,
		content: {
			type: RouteContentType.COMPONENT,
			component: AbookCreatePage,
		},
	},
	{
		path: Routes.abookShow.path,
		content: {
			type: RouteContentType.COMPONENT,
			component: AbookShowPage,
		},
	},
	{
		path: Routes.abookEdit.path,
		content: {
			type: RouteContentType.COMPONENT,
			component: AbookEditPage,
		},
	},
	{
		path: Routes.abookEntries.path,
		content: {
			type: RouteContentType.COMPONENT,
			component: AbookEntriesPage,
		},
	},
	{
		path: Routes.about.path,
		content: {
			type: RouteContentType.COMPONENT,
			component: AboutPage,
		},
	},
	{
		path: Routes.settings.path,
		content: {
			type: RouteContentType.COMPONENT,
			component: SettingsPage,
		},
	},
	{
		path: Routes.storage.path,
		content: {
			type: RouteContentType.COMPONENT,
			component: StoragePage,
		},
	},
]

const notFoundContent = {
	type: RouteContentType.COMPONENT,
	component: NotFoundPage,
} as const

export const RouterConfig = Object.freeze({
	routes,
	notFoundContent,
})
