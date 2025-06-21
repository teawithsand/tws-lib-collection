import { Language } from "@teawithsand/fstate"
import { AppTranslation } from "./translation"

export const translationEnUs: Readonly<AppTranslation> = {
	language: Language.ENGLISH_US,
	generic: {
		form: {
			thisFieldMustNotBeEmpty: () => "This field must not be empty",
			discoveryPriorityMustNotBeNegative: () =>
				"Discovery priority must not be negative",
			discoveryPriorityMustBeValidNumber: () =>
				"Discovery priority must be a valid number",
			discoveryPriorityMustBeInteger: () =>
				"Discovery priority must be a whole number",
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
	card: {
		form: {
			createCard: () => "Create Card",
			editCard: () => "Edit Card",
			submit: () => "Submit",
			cardId: () => "Card ID",
			enterCardId: () => "Enter card ID",
			questionContent: () => "Question Content",
			enterQuestionContent: () => "Enter the question content",
			answerContent: () => "Answer Content",
			enterAnswerContent: () => "Enter the answer content",
			discoveryPriority: () => "Discovery Priority",
			enterDiscoveryPriority: () =>
				"Enter discovery priority (0 or higher)",
			formValidationErrors: () => "Form Validation Errors",
		},
	},
	auth: {
		login: {
			submit: () => "Login",
			username: () => "Username",
			enterUsername: () => "Enter username",
			password: () => "Password",
			enterPassword: () => "Enter password",
			formValidationErrors: () => "Form Validation Errors",
			submissionError: () => "Submission Error",
			unexpectedError: () =>
				"An unexpected error occurred. Please try again.",
		},
		register: {
			submit: () => "Register",
			username: () => "Username",
			enterUsername: () => "Enter username",
			password: () => "Password",
			enterPassword: () => "Enter password",
			confirmPassword: () => "Confirm Password",
			enterConfirmPassword: () => "Confirm your password",
			formValidationErrors: () => "Form Validation Errors",
			passwordsDoNotMatch: () => "Passwords do not match",
			submissionError: () => "Submission Error",
			unexpectedError: () =>
				"An unexpected error occurred. Please try again.",
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
