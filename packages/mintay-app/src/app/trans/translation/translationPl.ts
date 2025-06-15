import { Language } from "@teawithsand/fstate"
import { AppTranslation } from "./translation"

export const translationPl: Readonly<AppTranslation> = {
	language: Language.POLISH,
	generic: {
		form: {
			thisFieldMustNotBeEmpty: () => "To pole nie może być puste",
		},
	},
	collection: {
		form: {
			createCollection: () => "Utwórz kolekcję",
			submit: () => "Zatwierdź",
			collectionName: () => "Nazwa kolekcji",
			enterCollectionName: () => "Wprowadź nazwę kolekcji",
			description: () => "Opis",
			enterCollectionDescription: () =>
				"Wprowadź opis kolekcji (opcjonalnie)",
			formValidationErrors: () => "Błędy walidacji formularza",
		},
	},
}
