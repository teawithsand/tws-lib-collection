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
	about: {
		title: () => "O Mintay",
		subtitle: () => "System Interwałowego Powtarzania dla Lepszego Uczenia",
		applicationInfo: () => "Informacje o Aplikacji",
		version: () => "Wersja:",
		license: () => "Licencja:",
		author: () => "Autor",
		github: () => "GitHub",
		aboutTheProject: () => "O Projekcie",
		projectDescription: () =>
			"Mintay to nowoczesny system interwałowego powtarzania zaprojektowany w celu optymalizacji uczenia się i zapamiętywania. Zbudowany w React i TypeScript, zapewnia intuicyjny interfejs do tworzenia i zarządzania kolekcjami fiszek.",
	},
}
