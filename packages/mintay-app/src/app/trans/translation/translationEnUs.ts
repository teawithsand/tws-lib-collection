import { Language } from "@teawithsand/fstate"
import { AppTranslation } from "./translation"

export const translationEnUs: Readonly<AppTranslation> = {
	language: Language.ENGLISH_US,
	generic: {
		form: {
			thisFieldMustNotBeEmpty: () => "This field must not be empty",
		},
	},
	collection: {
		form: {
			createCollection: () => "Create Collection",
			submit: () => "Submit",
			collectionName: () => "Collection Name",
			enterCollectionName: () => "Enter collection name",
			description: () => "Description",
			enterCollectionDescription: () =>
				"Enter collection description (optional)",
			formValidationErrors: () => "Form Validation Errors",
		},
	},
}
