import { Language } from "@teawithsand/fstate"

export interface MluiBaseTranslation {
	language: Language
	date: {
		dateTime: (date: Date) => string
		date: (date: Date) => string
		time: (date: Date) => string
	}
	generic: {
		loading: () => string
		error: () => string
		success: () => string
		cancel: () => string
		confirm: () => string
		submit: () => string
	}
	form: {
		validation: {
			required: () => string
			invalidFormat: () => string
		}
	}
	ui: {
		buttons: {
			close: () => string
			save: () => string
			delete: () => string
			edit: () => string
			add: () => string
		}
		navigation: {
			back: () => string
			next: () => string
			previous: () => string
		}
	}
}
