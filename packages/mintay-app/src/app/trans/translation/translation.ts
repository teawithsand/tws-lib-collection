import { Language } from "@teawithsand/fstate"

export interface AppTranslation {
	language: Language
	generic: {
		form: {
			thisFieldMustNotBeEmpty: () => string
		}
	}
	collection: {
		form: {
			createCollection: () => string
			submit: () => string
			collectionName: () => string
			enterCollectionName: () => string
			description: () => string
			enterCollectionDescription: () => string
			formValidationErrors: () => string
		}
	}
}
