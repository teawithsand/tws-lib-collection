import { Language } from "@teawithsand/fstate"
import { AppTranslation } from "./appTranslation"

const formatSize = (bytes: number | undefined) => {
	if (bytes === undefined) return "Unknown"
	if (bytes === 0) return "0 Bytes"

	const k = 1024
	const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
	const i = Math.floor(Math.log(bytes) / Math.log(k))

	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export const translationEnUs: Readonly<AppTranslation> = {
	language: Language.ENGLISH_US,
	common: {
		error: "Error",
	},
	util: {
		formatSize,
	},
	globalErrorFallback: {
		title: "Something went wrong",
		description:
			"An unexpected error occurred while loading the application. Please try refreshing the page to continue.",
		errorDetailsLabel: "Error Details:",
		unknownErrorMessage: "Unknown error occurred",
		refreshButtonText: "Refresh Page",
	},
	layout: {
		appTitle: "Palmabooks",
		drawerTitle: "Navigation",
		navigation: {
			home: "Home",
			books: "Books",
			settings: "Settings",
			storage: "Storage",
			about: "About",
		},
	},
	notFoundPage: {
		title: "Page Not Found",
		description: "The page you're looking for doesn't exist.",
		goBackToHome: "Go back to home page",
	},
	storage: {
		pageTitle: "Storage Management",
		quota: {
			title: "Storage Quota",
			usedSpace: "Used Space:",
			totalQuota: "Total Quota:",
			usage: "Usage:",
		},
		persistence: {
			title: "Storage Persistence",
			isPersistent: "Storage is Persistent:",
			isPersisted: (value: boolean) => (value ? "Yes" : "No"),
			description:
				"Non-persistent storage may be cleared by the browser when storage is low.",
			requestButton: "Request Persistent Storage",
			requestError:
				"Failed to request persistent storage. Please try again later.",
			requestRejected:
				"Persistent storage request was denied. Try refreshing page and try again later.",
			refreshPageButton: "Refresh Page",
			refreshPageDescription:
				"If you clicked 'deny' by mistake, refreshing the page will let you try allowing storage permission again. Also, sometimes it just so happens it helps, so if above button does not work, try this one and then the other one.",
		},
		actions: {
			title: "Actions",
			refreshButton: "Refresh Storage Info",
			refreshDescription:
				"Refresh the storage information to get the latest quota and usage data.",
		},
		formatPercentage: (
			used: number | undefined,
			total: number | undefined,
		) => {
			if (used === undefined || total === undefined || total === 0)
				return "Unknown"
			const percentage = (used / total) * 100
			return `${percentage.toFixed(1)}%`
		},
	},
	pages: {
		home: {
			title: "Welcome to PalmaBooks",
			subtitle: "Your personal book management application",
			description:
				"Organize your books, track your reading progress, and discover new favorites.",
		},
		about: {
			title: "About PalmaBooks",
			description:
				"PalmaBooks is a comprehensive book management application designed to help you organize your personal library and track your reading journey.",
			featuresTitle: "Features include:",
			features: {
				trackProgress: "Track reading progress",
				addNotes: "Add personal notes and reviews",
				searchFilter: "Search and filter your collection",
			},
		},
		settings: {
			title: "Settings",
			description: "Configure your application preferences.",
			sections: {
				theme: {
					title: "Theme",
					description: "Choose your preferred color scheme.",
					options: {
						light: "Light",
						dark: "Dark",
						auto: "Follow system",
					},
				},
			},
		},
	},
	abook: {
		addFilesWizard: {
			tabs: {
				picking: "Pick files",
				checking: "Adjust them",
				uploading: "Upload",
			},
			notifications: {
				filesRejected: {
					title: "Files Rejected",
					message: (count: number) =>
						`${count} file${count === 1 ? "" : "s"} ${count === 1 ? "was" : "were"} rejected`,
				},
			},
			uploadTab: {
				prompt: "Do you want to add files to the ABook?",
				newFilesSize: (bytes: number | undefined) =>
					`New files size: ${formatSize(bytes)}`,
				uploadButton: "Upload",
				emptyState: "There are no files!",
			},
		},
		view: {
			unknown: "Unknown",
			inProgress: "In Progress",
			entryCount: (count: number) =>
				`${count} ${count === 1 ? "entry" : "entries"}`,
			notePrefix: "Note:",
			formatDuration: (milliseconds: number) => {
				if (milliseconds <= 0) return "Unknown"

				const totalSeconds = Math.floor(milliseconds / 1000)
				const hours = Math.floor(totalSeconds / 3600)
				const minutes = Math.floor((totalSeconds % 3600) / 60)

				if (hours > 0) {
					return `${hours}h ${minutes}m`
				}
				return `${minutes}m`
			},
		},
		list: {
			emptyState: {
				noAudiobooks: "No audiobooks found",
				createFirst: "Create your first audiobook to get started",
			},
		},
	},
}
