import { Language } from "@teawithsand/fstate"
import { AppTranslation } from "./translation"

export const translationRu: Readonly<AppTranslation> = {
	language: Language.RUSSIAN,
	generic: {
		form: {
			thisFieldMustNotBeEmpty: () => "Это поле не должно быть пустым",
		},
		loading: () => "Загрузка...",
	},
	appBar: {
		title: () => "Mintay",
		navigation: () => "Навигация",
	},
	collection: {
		form: {
			createCollection: () => "Создать коллекцию",
			editCollection: () => "Редактировать коллекцию",
			submit: () => "Отправить",
			collectionName: () => "Название коллекции",
			enterCollectionName: () => "Введите название коллекции",
			description: () => "Описание",
			enterCollectionDescription: () =>
				"Введите описание коллекции (необязательно)",
			formValidationErrors: () => "Ошибки валидации формы",
		},
	},
	about: {
		title: () => "О Mintay",
		subtitle: () =>
			"Система Интервального Повторения для Улучшения Обучения",
		applicationInfo: () => "Информация о Приложении",
		version: () => "Версия:",
		license: () => "Лицензия:",
		author: () => "Автор",
		github: () => "GitHub",
		aboutTheProject: () => "О Проекте",
		projectDescription: () =>
			"Mintay - это современная система интервального повторения, разработанная для оптимизации обучения и запоминания. Построенная на React и TypeScript, она предоставляет интуитивно понятный интерфейс для создания и управления коллекциями карточек.",
	},
}
