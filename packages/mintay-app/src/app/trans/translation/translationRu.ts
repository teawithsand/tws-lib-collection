import { Language } from "@teawithsand/fstate"
import { AppTranslation } from "./translation"

export const translationRu: Readonly<AppTranslation> = {
	language: Language.RUSSIAN,
	generic: {
		form: {
			thisFieldMustNotBeEmpty: () => "Это поле не должно быть пустым",
			discoveryPriorityMustNotBeNegative: () =>
				"Приоритет обнаружения не может быть отрицательным",
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
	card: {
		form: {
			createCard: () => "Создать карточку",
			editCard: () => "Редактировать карточку",
			submit: () => "Отправить",
			cardId: () => "ID карточки",
			enterCardId: () => "Введите ID карточки",
			questionContent: () => "Содержание вопроса",
			enterQuestionContent: () => "Введите содержание вопроса",
			answerContent: () => "Содержание ответа",
			enterAnswerContent: () => "Введите содержание ответа",
			discoveryPriority: () => "Приоритет обнаружения",
			enterDiscoveryPriority: () =>
				"Введите приоритет обнаружения (0 или больше)",
			formValidationErrors: () => "Ошибки валидации формы",
		},
	},
	auth: {
		login: {
			submit: () => "Войти",
			username: () => "Имя пользователя",
			enterUsername: () => "Введите имя пользователя",
			password: () => "Пароль",
			enterPassword: () => "Введите пароль",
			formValidationErrors: () => "Ошибки валидации формы",
			submissionError: () => "Ошибка отправки",
			unexpectedError: () =>
				"Произошла непредвиденная ошибка. Попробуйте еще раз.",
		},
		register: {
			submit: () => "Зарегистрироваться",
			username: () => "Имя пользователя",
			enterUsername: () => "Введите имя пользователя",
			password: () => "Пароль",
			enterPassword: () => "Введите пароль",
			confirmPassword: () => "Подтвердите пароль",
			enterConfirmPassword: () => "Подтвердите ваш пароль",
			formValidationErrors: () => "Ошибки валидации формы",
			passwordsDoNotMatch: () => "Пароли не совпадают",
			submissionError: () => "Ошибка отправки",
			unexpectedError: () =>
				"Произошла непредвиденная ошибка. Попробуйте еще раз.",
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
