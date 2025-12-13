import { AbookEntryDisposition } from "@teawithsand/booklibr"
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
		cancel: "Cancel",
		edit: "Edit",
	},
	util: {
		formatSize,
		formatDuration: (milliseconds: number) => {
			if (Number.isNaN(milliseconds)) return "NaN"
			if (milliseconds === Infinity) return "+Infinity"
			if (milliseconds === -Infinity) return "-Infinity"
			if (milliseconds === 0) return "0m"

			const isNegative = milliseconds < 0
			const absMilliseconds = Math.abs(milliseconds)

			const totalSeconds = Math.floor(absMilliseconds / 1000)
			const hours = Math.floor(totalSeconds / 3600)
			const minutes = Math.floor((totalSeconds % 3600) / 60)

			let result = ""
			if (hours > 0) {
				result = `${hours}h ${minutes}m`
			} else {
				result = `${minutes}m`
			}

			return isNegative ? `-${result}` : result
		},
		formatDate: (timestamp: number) => {
			return new Date(timestamp).toLocaleDateString()
		},
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
			noDescription: "No description",
			audiobookCoverAlt: "Audiobook cover",
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
		preview: {
			title: "Audiobook Details",
			metadata: {
				title: "Title",
				description: "Description",
				createdAt: "Created",
				lastPlayedAt: "Last Played",
				never: "Never",
			},
			stats: {
				title: "Statistics",
				duration: "Duration",
				entries: "Entries",
				progress: "Progress",
				notStarted: "Not Started",
			},
			notes: {
				title: "Personal Notes",
				placeholder: "No personal notes",
			},
		},
		show: {
			backToList: "Back to List",
			noTitle: "Untitled Audiobook",
			noDescription: "No description available",
			entries: "Entries",
			viewEntries: "View Entries",
			duration: "Duration",
			created: "Created",
			lastPlayed: "Last Played",
			never: "Never",
			privateNote: "Private Note",
			noPrivateNote: "No private notes",
			loading: "Loading audiobook...",
			notFound: "Audiobook not found",
			error: "Failed to load audiobook",
		},
		list: {
			emptyState: {
				noAudiobooks: "No audiobooks found",
				createFirst: "Create your first audiobook to get started",
			},
			createButton: "Create Audiobook",
			progress: "Progress",
			lastPlayed: "Last played",
			searchPlaceholder: "Search audiobooks...",
			refreshButton: "Refresh list",
		},
		entries: {
			emptyState: {
				noEntries: "No entries found",
				noEntriesSubtext: "No entries in this audiobook yet.",
				noMatchingEntries: "No entries match your search.",
			},
			searchPlaceholder: "Search entries...",
			sortLabel: "Sort by",
			filterModal: {
				title: "Sort & Filter Entries",
				openButton: "Sort and filter options",
				sortSection: "Sort By",
				filterSection: "Filter by Type",
				confirmButton: "Apply",
				cancelButton: "Cancel",
				dispositions: {
					playableAudio: "Audio Files",
					coverImage: "Cover Images",
					description: "Descriptions",
					unknown: "Unknown",
					getLabel: (disposition: AbookEntryDisposition) => {
						switch (disposition) {
							case AbookEntryDisposition.PLAYABLE_AUDIO:
								return "Audio Files"
							case AbookEntryDisposition.COVER_IMAGE:
								return "Cover Images"
							case AbookEntryDisposition.DESCRIPTION:
								return "Descriptions"
							case AbookEntryDisposition.UNKNOWN:
							default:
								return "Unknown"
						}
					},
				},
			},
			getSortOptionLabel: (option: string) => {
				if (option === "ordinal-number-asc") {
					return "Ordinal Number (1-9)"
				}
				if (option === "ordinal-number-desc") {
					return "Ordinal Number (9-1)"
				}
				if (option === "name-asc") {
					return "Name (A-Z)"
				}
				if (option === "name-desc") {
					return "Name (Z-A)"
				}
				return "Unknown"
			},
			preview: {
				title: "Entry Preview",
				noEntry: "No entry selected",
				untitled: "Untitled Entry",
				ordinal: "Ordinal #",
				disposition: "Type",
				fileInfo: "File Information",
				fileSize: "File Size",
				duration: "Duration",
				sourceInfo: "Source Information",
				sourceType: "Source Type",
				uploadFileName: "File Name",
				mimeType: "MIME Type",
				url: "URL",
				openLink: "Open Link",
				timestamps: "Timestamps",
				createdAt: "Created At",
				uploadedAt: "Uploaded At",
				closeButton: "Close",
				unknown: "Unknown",

				dispositions: {
					playableAudio: "Audio File",
					coverImage: "Cover Image",
					description: "Description",
					unknown: "Unknown",
					getLabel: (disposition: AbookEntryDisposition) => {
						switch (disposition) {
							case AbookEntryDisposition.PLAYABLE_AUDIO:
								return "Audio File"
							case AbookEntryDisposition.COVER_IMAGE:
								return "Cover Image"
							case AbookEntryDisposition.DESCRIPTION:
								return "Description"
							case AbookEntryDisposition.UNKNOWN:
							default:
								return "Unknown"
						}
					},
				},
			},
		},
		create: {
			pageTitle: "Create New Audiobook",
			form: {
				validationErrors: "Form Validation Errors",
				submissionError: "Submission Error",
				unexpectedError: "An unexpected error occurred",
				titleLabel: "Audiobook Title",
				titlePlaceholder: "Enter audiobook title",
				filesLabel: "Files",
				filesPlaceholder: "Select audio files, cover images, etc.",
				filesSelected: (count: number) =>
					`${count} file${count === 1 ? "" : "s"} selected:`,
				descriptionLabel: "Description",
				descriptionPlaceholder:
					"Enter audiobook description (optional)",
				privateNoteLabel: "Private Note",
				privateNotePlaceholder: "Enter private notes (optional)",
				moreProperties: "More Properties",
				submitButton: "Create Audiobook",
				create: "Create",
				creating: "Creating...",
			},
		},
		edit: {
			pageTitle: "Edit Audiobook",
			form: {
				submitButton: "Save Changes",
			},
		},
		delete: {
			modalTitle: "Delete Audiobook",
			confirmationMessage:
				"Are you sure you want to delete this audiobook?",
			warningMessage:
				"This action cannot be undone. All audiobook data, including entries and personal notes, will be permanently deleted.",
			deleteButton: "Delete",
			deleting: "Deleting...",
			cancelButton: "Cancel",
			successTitle: "Audiobook Deleted!",
			successMessage: "The audiobook has been successfully deleted.",
			closeButton: "Close",
			errorTitle: "Deletion Failed",
			errorMessage:
				"An unexpected error occurred while deleting the audiobook.",
			noAbookSelected: "No audiobook selected for deletion.",
		},
	},
}
