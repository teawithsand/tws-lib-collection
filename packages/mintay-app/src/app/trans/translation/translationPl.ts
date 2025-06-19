import { Language } from "@teawithsand/fstate"
import { AppTranslation } from "./translation"

export const translationPl: Readonly<AppTranslation> = {
	language: Language.POLISH,
	generic: {
		form: {
			thisFieldMustNotBeEmpty: () => "To pole nie może być puste",
			discoveryPriorityMustNotBeNegative: () =>
				"Priorytet odkrycia nie może być ujemny",
			discoveryPriorityMustBeValidNumber: () =>
				"Priorytet odkrycia musi być prawidłową liczbą",
			discoveryPriorityMustBeInteger: () =>
				"Priorytet odkrycia musi być liczbą całkowitą",
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
	card: {
		form: {
			createCard: () => "Utwórz kartę",
			editCard: () => "Edytuj kartę",
			submit: () => "Zatwierdź",
			cardId: () => "ID karty",
			enterCardId: () => "Wprowadź ID karty",
			questionContent: () => "Treść pytania",
			enterQuestionContent: () => "Wprowadź treść pytania",
			answerContent: () => "Treść odpowiedzi",
			enterAnswerContent: () => "Wprowadź treść odpowiedzi",
			discoveryPriority: () => "Priorytet odkrycia",
			enterDiscoveryPriority: () =>
				"Wprowadź priorytet odkrycia (0 lub więcej)",
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
			submissionError: () => "Błąd przesyłania",
			unexpectedError: () =>
				"Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
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
			submissionError: () => "Błąd przesyłania",
			unexpectedError: () =>
				"Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
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
