import { Language, TransPickerImpl, TransString } from "@teawithsand/fstate"
import { translationEnUs } from "./en_us"

export interface AppTranslation {
	language: Language
	common: {
		error: string
	}
	util: {
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
	abook: {
		addFilesWizard: {
			tabs: {
				picking: string
				checking: string
				uploading: string
			}
			notifications: {
				filesRejected: {
					title: string
					message: (count: number) => string
				}
			}
			uploadTab: {
				prompt: string
				newFilesSize: (bytes: number | undefined) => string
				uploadButton: string
				emptyState: string
			}
		}
	}
}

export type AppTransString = TransString<AppTranslation>

export const AppTransPicker = new TransPickerImpl({
	fallbackLanguage: Language.ENGLISH_US,
	translations: [translationEnUs],
})
