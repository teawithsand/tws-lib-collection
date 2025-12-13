import { Language, TransPickerImpl, TransString } from "@teawithsand/fstate"
import { translationEnUs } from "./en_us"

export interface AppTranslation {
	language: Language
	common: {
		error: string
		cancel: string
	}
	util: {
		formatSize: (bytes: number | undefined) => string
		formatDuration: (milliseconds: number) => string
		formatDate: (timestamp: number) => string
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
		view: {
			unknown: string
			inProgress: string
			noDescription: string
			audiobookCoverAlt: string
			entryCount: (count: number) => string
			notePrefix: string
			formatDuration: (milliseconds: number) => string
		}
		preview: {
			title: string
			metadata: {
				title: string
				description: string
				createdAt: string
				lastPlayedAt: string
				never: string
			}
			stats: {
				title: string
				duration: string
				entries: string
				progress: string
				notStarted: string
			}
			notes: {
				title: string
				placeholder: string
			}
		}
		show: {
			backToList: string
			noTitle: string
			noDescription: string
			entries: string
			duration: string
			created: string
			lastPlayed: string
			never: string
			privateNote: string
			noPrivateNote: string
			loading: string
			notFound: string
			error: string
		}
		list: {
			emptyState: {
				noAudiobooks: string
				createFirst: string
			}
			createButton: string
			progress: string
			lastPlayed: string
			searchPlaceholder: string
			refreshButton: string
		}
		create: {
			pageTitle: string
			form: {
				validationErrors: string
				submissionError: string
				unexpectedError: string
				titleLabel: string
				titlePlaceholder: string
				filesLabel: string
				filesPlaceholder: string
				filesSelected: (count: number) => string
				descriptionLabel: string
				descriptionPlaceholder: string
				privateNoteLabel: string
				privateNotePlaceholder: string
				moreProperties: string
				submitButton: string
				create: string
				creating: string
			}
		}
	}
}

export type AppTransString = TransString<AppTranslation>

export const AppTransPicker = new TransPickerImpl({
	fallbackLanguage: Language.ENGLISH_US,
	translations: [translationEnUs],
})
