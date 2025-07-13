import { Language } from "@teawithsand/fstate"
import type { MluiBaseTranslation } from "../baseTranslation"

export const mluiBaseTranslationPl: Readonly<MluiBaseTranslation> = {
	language: Language.POLISH,
	date: {
		dateTime: (date: Date) =>
			new Intl.DateTimeFormat("pl-PL", {
				year: "numeric",
				month: "short",
				day: "numeric",
				hour: "numeric",
				minute: "2-digit",
				hour12: false,
			}).format(date),
		date: (date: Date) =>
			new Intl.DateTimeFormat("pl-PL", {
				year: "numeric",
				month: "short",
				day: "numeric",
			}).format(date),
		time: (date: Date) =>
			new Intl.DateTimeFormat("pl-PL", {
				hour: "numeric",
				minute: "2-digit",
				hour12: false,
			}).format(date),
	},
	generic: {
		loading: () => "Ładowanie...",
		error: () => "Błąd",
		success: () => "Sukces",
		cancel: () => "Anuluj",
		confirm: () => "Potwierdź",
		submit: () => "Zatwierdź",
	},
	form: {
		validation: {
			required: () => "To pole jest wymagane",
			invalidFormat: () => "Nieprawidłowy format",
		},
	},
	ui: {
		buttons: {
			close: () => "Zamknij",
			save: () => "Zapisz",
			delete: () => "Usuń",
			edit: () => "Edytuj",
			add: () => "Dodaj",
		},
		navigation: {
			back: () => "Wstecz",
			next: () => "Dalej",
			previous: () => "Poprzedni",
		},
	},
}
