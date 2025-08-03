import { Language } from "@teawithsand/fstate"
import { AppTranslation } from "./appTranslation"

export const translationEnUs: Readonly<AppTranslation> = {
	language: Language.ENGLISH_US,
	common: {
		error: "Error",
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
	abooks: {
		pageTitle: "My Audiobooks",
		list: {
			emptyState: {
				title: "No audiobooks yet",
				description:
					"Start building your audiobook collection by creating your first audiobook.",
				createButton: "Create Audiobook",
			},
			addButton: "Add Audiobook",
			countText: (count: number) => {
				if (count === 0) return "Manage your audiobook collection"
				return count === 1
					? `${count} audiobook`
					: `${count} audiobooks`
			},
			entryCountText: (count: number) =>
				count === 1 ? `${count} entry` : `${count} entries`,
			formatDuration: (durationMillis: number) => {
				if (durationMillis <= 0) return "Unknown duration"
				const minutes = Math.round(durationMillis / 1000 / 60)
				return `${minutes} min`
			},
		},
		form: {
			title: "Book Title",
			titlePlaceholder: "Enter the book title",
			description: "Description",
			descriptionPlaceholder: "Enter a description for the book",
			privateUserNote: "Private Notes",
			privateUserNotePlaceholder: "Enter private notes about this book",
			createButton: "Create Book",
			createPageTitle: "Create New Audio Book",
			formValidationErrors: "Please fix the following errors:",
			submissionError: "Failed to create book",
			unexpectedError: "An unexpected error occurred",
			validation: {
				titleMustNotBeEmpty: "Title must not be empty",
				titleTooLong: "Title must not exceed 200 characters",
				descriptionTooLong:
					"Description must not exceed 2000 characters",
				privateUserNoteTooLong:
					"Private note must not exceed 1000 characters",
			},
		},
		preview: {
			title: "Audiobook Preview",
			backButton: "Back",
			editButton: "Edit",
			metadata: "Metadata",
			entries: "Entries",
			duration: "Duration",
			entryCount: "Entry Count",
			noEntries: "No entries yet",
			description: "Description",
			formatDuration: (millis: number) => {
				const totalSeconds = Math.floor(millis / 1000)
				const hours = Math.floor(totalSeconds / 3600)
				const minutes = Math.floor((totalSeconds % 3600) / 60)
				const seconds = totalSeconds % 60

				if (hours > 0) {
					return `${hours}h ${minutes}m ${seconds}s`
				}
				if (minutes > 0) {
					return `${minutes}m ${seconds}s`
				}
				return `${seconds}s`
			},
			createdLabel: "Created",
			sourceLabel: "Source",
			dispositionLabel: "Disposition",
			durationLabel: "Duration",
			entryTitle: (index: number) => `Entry ${index + 1}`,
		},
		notFound: {
			title: "Audiobook Not Found",
			description: "The requested audiobook could not be found.",
			goBackButton: "Go Back",
		},
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
		formatBytes: (bytes: number | undefined) => {
			if (bytes === undefined) return "Unknown"
			if (bytes === 0) return "0 Bytes"

			const k = 1024
			const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
			const i = Math.floor(Math.log(bytes) / Math.log(k))

			return (
				parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
			)
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
}
