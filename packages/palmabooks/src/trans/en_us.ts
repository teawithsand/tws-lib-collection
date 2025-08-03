import { Language } from "@teawithsand/fstate"
import { AppTranslation } from "./appTranslation"

export const translationEnUs: Readonly<AppTranslation> = {
	language: Language.ENGLISH_US,
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
			categories: "Categories",
			settings: "Settings",
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
}
