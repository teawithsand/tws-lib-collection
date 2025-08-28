import { Language } from "@teawithsand/fstate"
import type { MluiBaseTranslation } from "../baseTranslation"

export const mluiBaseTranslationFr: Readonly<MluiBaseTranslation> = {
	language: Language.FRENCH,
	date: {
		dateTime: (date: Date) =>
			new Intl.DateTimeFormat("fr-FR", {
				year: "numeric",
				month: "short",
				day: "numeric",
				hour: "numeric",
				minute: "2-digit",
				hour12: false,
			}).format(date),
		date: (date: Date) =>
			new Intl.DateTimeFormat("fr-FR", {
				year: "numeric",
				month: "short",
				day: "numeric",
			}).format(date),
		time: (date: Date) =>
			new Intl.DateTimeFormat("fr-FR", {
				hour: "numeric",
				minute: "2-digit",
				hour12: false,
			}).format(date),
	},
	generic: {
		loading: () => "Chargement...",
		error: () => "Erreur",
		success: () => "Succès",
		cancel: () => "Annuler",
		confirm: () => "Confirmer",
		submit: () => "Soumettre",
	},
	form: {
		validation: {
			required: () => "Ce champ est requis",
			invalidFormat: () => "Format invalide",
		},
	},
	ui: {
		buttons: {
			close: () => "Fermer",
			save: () => "Enregistrer",
			delete: () => "Supprimer",
			edit: () => "Modifier",
			add: () => "Ajouter",
		},
		navigation: {
			back: () => "Retour",
			next: () => "Suivant",
			previous: () => "Précédent",
		},
		drawer: {
			title: () => "Navigation",
		},
	},
}
