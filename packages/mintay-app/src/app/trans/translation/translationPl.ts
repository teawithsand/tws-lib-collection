import { Language } from "@teawithsand/fstate"
import { AppTranslation } from "./translation"

export const translationPl: Readonly<AppTranslation> = {
	language: Language.POLISH,
	generic: {
		form: {
			thisFieldMustNotBeEmpty: () => "To pole nie może być puste",
		},
		loading: () => "Ładowanie...",
	},
	appBar: {
		title: () => "Mintay",
		navigation: () => "Nawigacja",
	},
	collection: {
		form: {
			createCollection: () => "Utwórz kolekcję",
			editCollection: () => "Edytuj kolekcję",
			submit: () => "Zatwierdź",
			collectionName: () => "Nazwa kolekcji",
			enterCollectionName: () => "Wprowadź nazwę kolekcji",
			description: () => "Opis",
			enterCollectionDescription: () =>
				"Wprowadź opis kolekcji (opcjonalnie)",
			formValidationErrors: () => "Błędy walidacji formularza",
		},
	},
	auth: {
		login: {
			submit: () => "Zaloguj się",
			username: () => "Nazwa użytkownika",
			enterUsername: () => "Wprowadź nazwę użytkownika",
			password: () => "Hasło",
			enterPassword: () => "Wprowadź hasło",
			formValidationErrors: () => "Błędy walidacji formularza",
		},
		register: {
			submit: () => "Zarejestruj się",
			username: () => "Nazwa użytkownika",
			enterUsername: () => "Wprowadź nazwę użytkownika",
			password: () => "Hasło",
			enterPassword: () => "Wprowadź hasło",
			confirmPassword: () => "Potwierdź hasło",
			enterConfirmPassword: () => "Potwierdź swoje hasło",
			formValidationErrors: () => "Błędy walidacji formularza",
			passwordsDoNotMatch: () => "Hasła nie pasują do siebie",
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
