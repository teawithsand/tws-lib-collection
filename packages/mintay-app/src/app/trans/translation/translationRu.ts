import { Language } from "@teawithsand/fstate"
import { AppTranslation } from "./translation"

export const translationRu: Readonly<AppTranslation> = {
	language: Language.RUSSIAN,
	generic: {
		form: {
			thisFieldMustNotBeEmpty: () => "Это поле не должно быть пустым",
		},
	},
	collection: {
		form: {
			createCollection: () => "Создать коллекцию",
			submit: () => "Отправить",
			collectionName: () => "Название коллекции",
			enterCollectionName: () => "Введите название коллекции",
			description: () => "Описание",
			enterCollectionDescription: () =>
				"Введите описание коллекции (необязательно)",
			formValidationErrors: () => "Ошибки валидации формы",
		},
	},
}
