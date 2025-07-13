import { Language } from "@teawithsand/fstate"
import type { MluiBaseTranslation } from "../baseTranslation"

export const mluiBaseTranslationEnUs: Readonly<MluiBaseTranslation> = {
	language: Language.ENGLISH_US,
	date: {
		dateTime: (date: Date) =>
			new Intl.DateTimeFormat("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric",
				hour: "numeric",
				minute: "2-digit",
				hour12: true,
			}).format(date),
		date: (date: Date) =>
			new Intl.DateTimeFormat("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric",
			}).format(date),
		time: (date: Date) =>
			new Intl.DateTimeFormat("en-US", {
				hour: "numeric",
				minute: "2-digit",
				hour12: true,
			}).format(date),
	},
	generic: {
		loading: () => "Loading...",
		error: () => "Error",
		success: () => "Success",
		cancel: () => "Cancel",
		confirm: () => "Confirm",
		submit: () => "Submit",
	},
	form: {
		validation: {
			required: () => "This field is required",
			invalidFormat: () => "Invalid format",
		},
	},
	ui: {
		buttons: {
			close: () => "Close",
			save: () => "Save",
			delete: () => "Delete",
			edit: () => "Edit",
			add: () => "Add",
		},
		navigation: {
			back: () => "Back",
			next: () => "Next",
			previous: () => "Previous",
		},
	},
}
