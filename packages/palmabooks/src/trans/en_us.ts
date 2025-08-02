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
	audiobooks: {
		pageTitle: "My Audiobooks",
		emptyState: {
			title: "No audiobooks yet",
			description:
				"Start building your audiobook collection by creating your first audiobook.",
			createButton: "Create Audiobook",
		},
		list: {
			addButton: "Add Audiobook",
			countSingular: "audiobook",
			countPlural: "audiobooks",
			fallbackSubtitle: "Manage your audiobook collection",
			entryCount: {
				singular: "entry",
				plural: "entries",
			},
			duration: {
				unknown: "Unknown duration",
				minutes: "min",
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
	},
}
