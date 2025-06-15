import { Language, TransPicker } from "../defines"

type BaseTrans = {
	language: Language
}

export class TransPickerImpl<T extends BaseTrans> implements TransPicker<T> {
	private readonly fallbackLanguage: Language
	private readonly translations: readonly T[]

	/**
	 * Creates a new TransPickerImpl instance.
	 * @param fallbackLanguage - The fallback language to use when no match is found
	 * @param translations - List of all available translations
	 * @throws Error if fallback language is not present in translations or if duplicate languages exist
	 */
	constructor({
		fallbackLanguage,
		translations,
	}: {
		fallbackLanguage: Language
		translations: readonly T[]
	}) {
		// Check for duplicate languages
		const languageStrings = translations.map((trans) =>
			trans.language.toString(),
		)
		const uniqueLanguages = new Set(languageStrings)
		if (languageStrings.length !== uniqueLanguages.size) {
			throw new Error("Duplicate languages found in translations")
		}

		// Check that fallback language exists in translations
		const hasFallback = translations.some((trans) =>
			trans.language.equals(fallbackLanguage),
		)
		if (!hasFallback) {
			throw new Error("Fallback language must be present in translations")
		}

		this.fallbackLanguage = fallbackLanguage
		this.translations = translations
	}

	/**
	 * Picks the most appropriate translation for the given languages.
	 * Processes languages in order of preference, applying priority logic for each:
	 * 1. Exact match (language and region)
	 * 2. Same language with no region match
	 * 3. Fallback language (if no matches found for any preferred language)
	 */
	public readonly pickTranslation = (languages: Language[]): T => {
		// Try each language in order of preference
		for (const language of languages) {
			// 1. Try exact match first
			const exactMatch = this.translations.find((trans) =>
				trans.language.equals(language),
			)
			if (exactMatch) {
				return exactMatch
			}
		}

		// 2. Try language matches (ignoring region) for all preferred languages
		for (const language of languages) {
			const languageMatch = this.translations.find((trans) =>
				trans.language.matches(language),
			)
			if (languageMatch) {
				return languageMatch
			}
		}

		// 3. Use fallback language
		const fallbackMatch = this.translations.find((trans) =>
			trans.language.equals(this.fallbackLanguage),
		)
		if (fallbackMatch) {
			return fallbackMatch
		}

		// This should never happen since we validate fallback exists in constructor
		throw new Error("Fallback language not found in translations")
	}
}
