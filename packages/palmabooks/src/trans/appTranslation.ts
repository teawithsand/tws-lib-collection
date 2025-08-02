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
	audiobooks: {
		pageTitle: string
		emptyState: {
			title: string
			description: string
			createButton: string
		}
		list: {
			addButton: string
			countSingular: string
			countPlural: string
			fallbackSubtitle: string
			entryCount: {
				singular: string
				plural: string
			}
			duration: {
				unknown: string
				minutes: string
			}
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
	}
}

export type AppTransString = TransString<AppTranslation>

export const AppTransPicker = new TransPickerImpl({
	fallbackLanguage: Language.ENGLISH_US,
	translations: [translationEnUs],
})
