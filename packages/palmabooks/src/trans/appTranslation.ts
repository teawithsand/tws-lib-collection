import { Language, TransPickerImpl, TransString } from "@teawithsand/fstate"
import { Timestamp } from "@teawithsand/lngext"
import { translationEnUs } from "./en_us"

export interface AppTranslation {
	language: Language
	common: {
		error: string
		cancel: string
		unknown: string
		submitFailedTitle: string
		explainError: (error: unknown) => string
	}
	util: {
		time: {
			formatDuration: (milliseconds: number) => string
			formatDate: (timestamp: number | Date | Timestamp) => string
		}
		formatSize: (bytes: number | undefined) => string
	}
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
			settings: string
			storage: string
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
			statusSingle: string
			statusMultiPart: string
		}
		form: {
			title: string
			titlePlaceholder: string
			description: string
			descriptionPlaceholder: string
			privateUserNote: string
			privateUserNotePlaceholder: string
			createButton: string
			updateButton: string
			createPageTitle: string
			formValidationErrors: string
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
			deleteButton: string
			metadata: string
			entries: string
			duration: string
			entryCount: string
			noEntries: string
			description: string
			createdLabel: string
			sourceLabel: string
			dispositionLabel: string
			durationLabel: string
			entryTitle: (index: number) => string
			totalDurationLabel: string
			entriesLabel: string
		}
		notFound: {
			title: string
			description: string
			goBackButton: string
		}
		deleteModal: {
			title: string
			fallbackTitle: string
			confirmationMessage: (title: string) => string
			warningMessage: string
			deleteButton: string
			deleteButtonDeleting: string
			cancelButton: string
			successMessage: string
			successDescription: string
			errorMessage: string
			noAudiobookSelectedTitle: string
			noAudiobookSelectedMessage: string
			warningTitle: string
			deleteFailedTitle: string
		}
	}
	storage: {
		pageTitle: string
		quota: {
			title: string
			usedSpace: string
			totalQuota: string
			usage: string
		}
		persistence: {
			title: string
			isPersistent: string
			isPersisted: (value: boolean) => string
			description: string
			requestButton: string
			requestError: string
			requestRejected: string
			refreshPageButton: string
			refreshPageDescription: string
		}
		actions: {
			title: string
			refreshButton: string
			refreshDescription: string
		}
		formatPercentage: (
			used: number | undefined,
			total: number | undefined,
		) => string
	}
	fileUpload: {
		label: string
		description: string
		placeholder: string
		filesSelected: (count: number) => string
		uploadFolder: string
		files: string
		total: string
		processingFiles: string
		clickToBrowse: string
		uploadError: string
		uploadFailed: string
		uploadingFiles: (progress: number) => string
		uploading: string
		uploadFiles: (count: number) => string
		cancel: string
		clearAll: string
		uploadTitle: (bookTitle: string) => string
		uploadDescription: string
		formValidationErrors: string
		dropFilesPlaceholder: string
	}
	pages: {
		home: {
			title: string
			subtitle: string
			description: string
		}
		about: {
			title: string
			description: string
			featuresTitle: string
			features: {
				trackProgress: string
				addNotes: string
				searchFilter: string
			}
		}
		settings: {
			title: string
			description: string
			underDevelopment: string
			sections: {
				theme: {
					title: string
					description: string
					options: {
						light: string
						dark: string
						auto: string
					}
				}
			}
		}
	}
}

export type AppTransString = TransString<AppTranslation>

export const AppTransPicker = new TransPickerImpl({
	fallbackLanguage: Language.ENGLISH_US,
	translations: [translationEnUs],
})
