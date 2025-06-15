import { atom } from "jotai"
import { Language } from "../defines"

/**
 * Creates a Jotai atom that tracks the browser's language with automatic updates.
 * Handles languagechange events and gracefully falls back when running in non-browser environments.
 */
export class BrowserLanguageAtomProvider {
	/**
	 * Creates and returns a Jotai atom that tracks the browser's current language.
	 * The atom automatically updates when the language changes and handles cleanup.
	 *
	 * It requires to be subscribed to in order to provide valid values.
	 *
	 * @returns Jotai atom containing the current Language or undefined if no browser context
	 */
	public static readonly createLanguageAtom = () => {
		const getCurrentLanguage = (): Language | undefined => {
			if (
				typeof window === "undefined" ||
				typeof navigator === "undefined"
			) {
				return undefined
			}

			try {
				const parsed = Language.tryParse(navigator.language)
				return parsed || undefined
			} catch {
				return undefined
			}
		}

		const baseAtom = atom<Language | undefined>(getCurrentLanguage())

		// Create derived atom with onMount for event handling
		const languageAtom = atom(
			(get) => get(baseAtom),
			(_get, set, newValue: Language | undefined) => {
				set(baseAtom, newValue)
			},
		)

		// Add onMount for language change event handling
		languageAtom.onMount = (setAtom) => {
			if (
				typeof window === "undefined" ||
				!("addEventListener" in window)
			) {
				return undefined
			}

			// Check if languagechange event is supported
			const supportsLanguageChange = "onlanguagechange" in window
			if (!supportsLanguageChange) {
				return undefined
			}

			const handleLanguageChange = (): void => {
				const newLanguage = getCurrentLanguage()
				setAtom(newLanguage)
			}

			try {
				window.addEventListener("languagechange", handleLanguageChange)

				// Return cleanup function
				return (): void => {
					window.removeEventListener(
						"languagechange",
						handleLanguageChange,
					)
				}
			} catch {
				// Gracefully handle case where addEventListener fails
				return undefined
			}
		}

		return atom((get) => get(languageAtom))
	}

	/**
	 * Creates and returns a Jotai atom that tracks all of the browser's preferred languages.
	 * The atom automatically updates when the languages change and handles cleanup.
	 *
	 * It requires to be subscribed to in order to provide valid values.
	 *
	 * @returns Jotai atom containing array of Languages or empty array if no browser context
	 */
	public static readonly createLanguagesAtom = () => {
		const getCurrentLanguages = (): readonly Language[] => {
			if (
				typeof window === "undefined" ||
				typeof navigator === "undefined" ||
				!navigator.languages
			) {
				return []
			}

			try {
				const languages: Language[] = []
				for (const langCode of navigator.languages) {
					const parsed = Language.tryParse(langCode)
					if (parsed) {
						languages.push(parsed)
					}
				}
				return languages
			} catch {
				return []
			}
		}

		const baseAtom = atom<readonly Language[]>(getCurrentLanguages())

		// Create derived atom with onMount for event handling
		const languagesAtom = atom(
			(get) => get(baseAtom),
			(_get, set, newValue: readonly Language[]) => {
				set(baseAtom, newValue)
			},
		)

		// Add onMount for language change event handling
		languagesAtom.onMount = (setAtom) => {
			if (
				typeof window === "undefined" ||
				!("addEventListener" in window)
			) {
				return undefined
			}

			// Check if languagechange event is supported
			const supportsLanguageChange = "onlanguagechange" in window
			if (!supportsLanguageChange) {
				return undefined
			}

			const handleLanguageChange = (): void => {
				const newLanguages = getCurrentLanguages()
				setAtom(newLanguages)
			}

			try {
				window.addEventListener("languagechange", handleLanguageChange)

				// Return cleanup function
				return (): void => {
					window.removeEventListener(
						"languagechange",
						handleLanguageChange,
					)
				}
			} catch {
				// Gracefully handle case where addEventListener fails
				return undefined
			}
		}

		return atom((get) => get(languagesAtom))
	}
}
