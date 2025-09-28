import {
	AbookCreatePage,
	AbookEditPage,
	AbookEntryShowPage,
	AbookListPage,
	AbookShowPage,
	AbookUploadPage,
	AboutPage,
	FileListPage,
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
		path: Routes.about.path,
		content: {
			type: RouteContentType.COMPONENT,
			component: AboutPage,
		},
	},
	{
		path: Routes.books.path,
		content: {
			type: RouteContentType.COMPONENT,
			component: AbookListPage,
		},
	},
	{
		path: Routes.addBook.path,
		content: {
			type: RouteContentType.COMPONENT,
			component: AbookCreatePage,
		},
	},
	{
		path: Routes.editBook.path,
		content: {
			type: RouteContentType.COMPONENT,
			component: AbookEditPage,
		},
	},
	{
		path: Routes.uploadFiles.path,
		content: {
			type: RouteContentType.COMPONENT,
			component: AbookUploadPage,
		},
	},
	{
		path: Routes.fileList.path,
		content: {
			type: RouteContentType.COMPONENT,
			component: FileListPage,
		},
	},
	{
		path: Routes.entryShow.path,
		content: {
			type: RouteContentType.COMPONENT,
			component: AbookEntryShowPage,
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
