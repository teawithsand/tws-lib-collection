import { Language } from "@teawithsand/fstate"
import { Timestamp } from "@teawithsand/lngext"
import { AppTranslation } from "./appTranslation"

export const translationEnUs: Readonly<AppTranslation> = {
	language: Language.ENGLISH_US,
	common: {
		error: "Error",
		cancel: "Cancel",
		unknown: "Unknown",
		submitFailedTitle: "Operation failed",
		explainError: (error: unknown): string => {
			if (error instanceof Error) {
				return error.message
			}
			return "An unexpected error occurred"
		},
	},
	util: {
		time: {
			formatDuration: (milliseconds: number) => {
				const totalSeconds = Math.floor(milliseconds / 1000)
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
			formatDate: (timestamp: number | Date | Timestamp) => {
				let dateValue: Date

				if (timestamp instanceof Date) {
					dateValue = timestamp
				} else if (timestamp instanceof Timestamp) {
					dateValue = new Date(timestamp.toNumberMillis())
				} else {
					dateValue = new Date(timestamp)
				}

				return dateValue.toLocaleDateString(undefined, {
					year: "numeric",
					month: "long",
					day: "numeric",
				})
			},
		},
		formatSize: (bytes: number | undefined) => {
			if (bytes === undefined) return "Unknown"
			if (bytes === 0) return "0 Bytes"

			const k = 1024
			const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
			const i = Math.floor(Math.log(bytes) / Math.log(k))

			return (
				parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
			)
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
			statusSingle: "Single",
			statusMultiPart: "Multi-part",
		},
		form: {
			title: "Book Title",
			titlePlaceholder: "Enter the book title",
			description: "Description",
			descriptionPlaceholder: "Enter a description for the book",
			privateUserNote: "Private Notes",
			privateUserNotePlaceholder: "Enter private notes about this book",
			createButton: "Create Book",
			updateButton: "Update Book",
			createPageTitle: "Create New Audio Book",
			formValidationErrors: "Please fix the following errors:",
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
			deleteButton: "Delete",
			metadata: "Metadata",
			entries: "Entries",
			duration: "Duration",
			entryCount: "Entry Count",
			noEntries: "No entries yet",
			description: "Description",
			createdLabel: "Created",
			sourceLabel: "Source",
			dispositionLabel: "Disposition",
			durationLabel: "Duration",
			entryTitle: (index: number) => `Entry ${index + 1}`,
			totalDurationLabel: "Total Duration",
			entriesLabel: "Entries",
		},
		notFound: {
			title: "Audiobook Not Found",
			description: "The requested audiobook could not be found.",
			goBackButton: "Go Back",
		},
		deleteModal: {
			title: "Delete Audiobook",
			fallbackTitle: "Untitled Audiobook",
			confirmationMessage: (title: string) =>
				`Are you sure you want to delete "${title}"?`,
			warningMessage:
				"This action cannot be undone. All associated entries and data will be permanently removed.",
			deleteButton: "Delete",
			deleteButtonDeleting: "Deleting...",
			cancelButton: "Cancel",
			successMessage: "Audiobook deleted successfully!",
			successDescription:
				"The audiobook has been removed from your collection.",
			errorMessage: "Failed to delete audiobook",
			noAudiobookSelectedTitle: "No Audiobook Selected",
			noAudiobookSelectedMessage: "No audiobook selected for deletion.",
			warningTitle: "Warning",
			deleteFailedTitle: "Delete Failed",
		},
		entry: {
			notFound: {
				title: "Entry Not Found",
				description:
					"The requested audiobook entry could not be found.",
			},
			metadata: {
				fileName: "File Name",
				uploaded: "Uploaded",
				ordinalLabel: "Ordinal Number",
				ordinalPlaceholder: "Enter the entry order number",
				extractedLabel: "Extracted",
			},
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
	fileUpload: {
		label: "File Upload",
		description: "Upload files by clicking here or drag and drop",
		placeholder: "No files selected",
		filesSelected: (count: number) => `${count} file(s) selected`,
		uploadFolder: "Upload Folder",
		files: "Files",
		total: "Total",
		processingFiles: "Processing files...",
		clickToBrowse: "Click to browse or drag and drop files here",
		uploadError: "Upload Error",
		uploadFailed: "Upload failed",
		uploadingFiles: (progress: number) =>
			`Uploading files... (${Math.round(progress)}%)`,
		uploading: "Uploading...",
		uploadFiles: (count: number) => `Upload ${count} file(s)`,
		cancel: "Cancel",
		clearAll: "Clear All",
		uploadTitle: (bookTitle: string) => `Upload Files to "${bookTitle}"`,
		uploadDescription:
			"Upload any files to add to this audiobook. File types will be automatically determined.",
		formValidationErrors: "Form Validation Errors",
		dropFilesPlaceholder: "Drop files here or click to browse",
	},
	fileList: {
		title: (count: number) => `File List (${count} files)`,
		empty: "No files to display",
		path: "Path",
		metadata: "Metadata",
		size: "Size",
		type: "Type",
		modified: "Modified",
		disposition: "Disposition",
		changeDisposition: "Change disposition",
		viewFiles: "View Files",
	},
	entryList: {
		filter: {
			searchPlaceholder: "Search files...",
			advancedFilter: "Advanced Filter",
			clearFilter: "Clear Filter",
			advancedFilterTitle: "Advanced Filter Options",
			searchLabel: "Search",
			dispositionLabel: "Disposition",
			dispositionPlaceholder: "Select disposition...",
			clearButton: "Clear",
			applyButton: "Apply",
		},
		selection: {
			totalSelected: (count: number) => `${count} selected`,
			totalSize: (size: string) => `Total size: ${size}`,
			unselectAll: "Unselect All",
			invertSelection: "Invert Selection",
		},
		operations: {
			title: (count: number) => `Operations (${count} files)`,
			selectAll: "Select All",
			deleteSelected: "Delete Selected",
			changeDisposition: "Change Disposition",
			confirmDelete: "Confirm Delete",
			deleteConfirmation: (count: number) =>
				`Are you sure you want to delete ${count} file${count === 1 ? "" : "s"}?`,
		},
		disposition: {
			title: (count: number) => `Disposition (${count} files)`,
			saveChanges: "Save Changes",
			discardChanges: "Discard Changes",
			hasChanges: (count: number) =>
				`${count} file${count === 1 ? "" : "s"} with changes`,
			noChanges: "No changes to save",
			labels: {
				playableAudio: "Playable Audio",
				coverImage: "Cover Image",
				description: "Description",
				unknown: "Unknown",
			},
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
			underDevelopment:
				"This page is under development. Settings configuration coming soon!",
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
}
