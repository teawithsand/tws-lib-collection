import { Language } from "@teawithsand/fstate"
import type { MluiBaseTranslation } from "../baseTranslation"

export const mluiBaseTranslationRu: Readonly<MluiBaseTranslation> = {
	language: Language.RUSSIAN,
	date: {
		dateTime: (date: Date) =>
			new Intl.DateTimeFormat("ru-RU", {
				year: "numeric",
				month: "short",
				day: "numeric",
				hour: "numeric",
				minute: "2-digit",
				hour12: false,
			}).format(date),
		date: (date: Date) =>
			new Intl.DateTimeFormat("ru-RU", {
				year: "numeric",
				month: "short",
				day: "numeric",
			}).format(date),
		time: (date: Date) =>
			new Intl.DateTimeFormat("ru-RU", {
				hour: "numeric",
				minute: "2-digit",
				hour12: false,
			}).format(date),
	},
	generic: {
		loading: () => "Загрузка...",
		error: () => "Ошибка",
		success: () => "Успех",
		cancel: () => "Отмена",
		confirm: () => "Подтвердить",
		submit: () => "Отправить",
	},
	form: {
		validation: {
			required: () => "Это поле обязательно",
			invalidFormat: () => "Неверный формат",
		},
	},
	ui: {
		buttons: {
			close: () => "Закрыть",
			save: () => "Сохранить",
			delete: () => "Удалить",
			edit: () => "Редактировать",
			add: () => "Добавить",
		},
		navigation: {
			back: () => "Назад",
			next: () => "Далее",
			previous: () => "Предыдущий",
		},
		drawer: {
			title: () => "Навигация",
		},
	},
}
