import { Language } from "@teawithsand/fstate"
import { AppTranslation } from "./translation"

export const translationEnUs: Readonly<AppTranslation> = {
	language: Language.ENGLISH_US,
	generic: {
		form: {
			thisFieldMustNotBeEmpty: () => "This field must not be empty",
		},
		loading: () => "Loading...",
	},
	appBar: {
		title: () => "Mintay",
		navigation: () => "Navigation",
	},
	collection: {
		form: {
			createCollection: () => "Create Collection",
			editCollection: () => "Edit Collection",
			submit: () => "Submit",
			collectionName: () => "Collection Name",
			enterCollectionName: () => "Enter collection name",
			description: () => "Description",
			enterCollectionDescription: () =>
				"Enter collection description (optional)",
			formValidationErrors: () => "Form Validation Errors",
		},
	},
	about: {
		title: () => "About Mintay",
		subtitle: () => "Spaced Repetition System for Enhanced Learning",
		applicationInfo: () => "Application Info",
		version: () => "Version:",
		license: () => "License:",
		author: () => "Author",
		github: () => "GitHub",
		aboutTheProject: () => "About the Project",
		projectDescription: () =>
			"Mintay is a modern spaced repetition system designed to optimize learning and memory retention. Built with React and TypeScript, it provides an intuitive interface for creating and managing flashcard collections.",
	},
}
