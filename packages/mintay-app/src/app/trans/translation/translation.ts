import { Language } from "@teawithsand/fstate"

export interface AppTranslation {
	language: Language
	generic: {
		form: {
			thisFieldMustNotBeEmpty: () => string
		}
		loading: () => string
	}
	appBar: {
		title: () => string
		navigation: () => string
	}
	collection: {
		form: {
			createCollection: () => string
			editCollection: () => string
			submit: () => string
			collectionName: () => string
			enterCollectionName: () => string
			description: () => string
			enterCollectionDescription: () => string
			formValidationErrors: () => string
		}
	}
	auth: {
		login: {
			submit: () => string
			username: () => string
			enterUsername: () => string
			password: () => string
			enterPassword: () => string
			formValidationErrors: () => string
			submissionError: () => string
			unexpectedError: () => string
		}
		register: {
			submit: () => string
			username: () => string
			enterUsername: () => string
			password: () => string
			enterPassword: () => string
			confirmPassword: () => string
			enterConfirmPassword: () => string
			formValidationErrors: () => string
			passwordsDoNotMatch: () => string
			submissionError: () => string
			unexpectedError: () => string
		}
	}
	about: {
		title: () => string
		subtitle: () => string
		applicationInfo: () => string
		version: () => string
		license: () => string
		author: () => string
		github: () => string
		aboutTheProject: () => string
		projectDescription: () => string
	}
}
