import { Language, TransPickerImpl, TransString } from "@teawithsand/fstate"
import { translationEnUs } from "./en_us"

export interface AppTranslation {
	language: Language
	globalErrorFallback: {
		title: string
		description: string
		errorDetailsLabel: string
		unknownErrorMessage: string
		refreshButtonText: string
	}
	layout: {
		appTitle: string
		drawerTitle: string
		navigation: {
			home: string
			books: string
			categories: string
			settings: string
			about: string
		}
	}
	notFoundPage: {
		title: string
		description: string
		goBackToHome: string
	}
	abooks: {
		pageTitle: string
		list: {
			emptyState: {
				title: string
				description: string
				createButton: string
			}
			addButton: string
			countText: (count: number) => string
			entryCountText: (count: number) => string
			formatDuration: (durationMillis: number) => string
		}
		form: {
			title: string
			titlePlaceholder: string
			description: string
			descriptionPlaceholder: string
			privateUserNote: string
			privateUserNotePlaceholder: string
			createButton: string
			createPageTitle: string
			formValidationErrors: string
			submissionError: string
			unexpectedError: string
			validation: {
				titleMustNotBeEmpty: string
				titleTooLong: string
				descriptionTooLong: string
				privateUserNoteTooLong: string
			}
		}
		preview: {
			title: string
			backButton: string
			editButton: string
			metadata: string
			entries: string
			duration: string
			entryCount: string
			noEntries: string
			description: string
			formatDuration: (millis: number) => string
			createdLabel: string
			sourceLabel: string
			dispositionLabel: string
			durationLabel: string
			entryTitle: (index: number) => string
		}
		notFound: {
			title: string
			description: string
			goBackButton: string
		}
	}
}

export type AppTransString = TransString<AppTranslation>

export const AppTransPicker = new TransPickerImpl({
	fallbackLanguage: Language.ENGLISH_US,
	translations: [translationEnUs],
})
