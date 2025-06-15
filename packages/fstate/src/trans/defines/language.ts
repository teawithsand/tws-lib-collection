/**
 * Represents a language with support for both short (xx) and long (xx-XX) format codes.
 * Can parse language strings and provide access to language and region components.
 */
export class Language {
	private readonly languageCode: string
	private readonly regionCode: string | undefined

	// Common language constants
	public static readonly POLISH = new Language("pl", "PL")
	public static readonly ENGLISH_US = new Language("en", "US")
	public static readonly RUSSIAN = new Language("ru", "RU")
	public static readonly FRENCH = new Language("fr", "FR")

	/**
	 * Creates a new Language instance.
	 * @param languageCode - The language code (e.g., "en")
	 * @param regionCode - The optional region code (e.g., "US")
	 */
	private constructor(languageCode: string, regionCode?: string) {
		this.languageCode = languageCode
		this.regionCode = regionCode
	}

	/**
	 * Gets the language code (e.g., "en")
	 */
	public readonly getLanguage = (): string => {
		return this.languageCode
	}

	/**
	 * Gets the region code if present (e.g., "US")
	 */
	public readonly getRegion = (): string | undefined => {
		return this.regionCode
	}

	/**
	 * Returns the full language code in xx-XX format if region is present, otherwise xx format
	 */
	public readonly toString = (): string => {
		return this.regionCode
			? `${this.languageCode}-${this.regionCode}`
			: this.languageCode
	}

	/**
	 * Returns the language code in short format (xx)
	 */
	public readonly toShortFormat = (): string => {
		return this.languageCode
	}

	/**
	 * Returns the language code in long format (xx-XX) if region is available
	 */
	public readonly toLongFormat = (): string | undefined => {
		return this.regionCode
			? `${this.languageCode}-${this.regionCode}`
			: undefined
	}

	/**
	 * Checks if this language has a region code
	 */
	public readonly hasRegion = (): boolean => {
		return this.regionCode !== undefined
	}

	/**
	 * Checks if this language matches another language (ignoring region if not specified)
	 */
	public readonly matches = (other: Language): boolean => {
		if (this.languageCode !== other.languageCode) {
			return false
		}

		if (this.regionCode && other.regionCode) {
			return this.regionCode === other.regionCode
		}

		return true
	}

	/**
	 * Checks if this language is structurally equal to another language
	 * Both language code and region code must match exactly
	 */
	public readonly equals = (other: Language): boolean => {
		return (
			this.languageCode === other.languageCode &&
			this.regionCode === other.regionCode
		)
	}

	/**
	 * Parses a language code string into language and optional region components
	 * Accepts case-insensitive input and normalizes to correct case (xx-XX format)
	 */
	private static readonly parseLanguageCode = (
		code: string,
	): { language: string; region?: string } | null => {
		if (!code || typeof code !== "string") {
			return null
		}

		const trimmedCode = code.trim()

		const longFormatMatch = trimmedCode.match(
			/^([a-zA-Z]{2})-([a-zA-Z]{2})$/,
		)
		if (longFormatMatch && longFormatMatch[1] && longFormatMatch[2]) {
			return {
				language: longFormatMatch[1].toLowerCase(),
				region: longFormatMatch[2].toUpperCase(),
			}
		}

		const shortFormatMatch = trimmedCode.match(/^([a-zA-Z]{2})$/)
		if (shortFormatMatch && shortFormatMatch[1]) {
			return {
				language: shortFormatMatch[1].toLowerCase(),
			}
		}

		return null
	}

	/**
	 * Static method to create a Language instance from a string
	 * @param code - Language code in either "xx" or "xx-XX" format
	 * @returns Language instance
	 * @throws Error if the language code format is invalid
	 */
	public static readonly parse = (code: string): Language => {
		const parsed = Language.parseLanguageCode(code)
		if (!parsed) {
			throw new Error(
				`Invalid language code format: ${code}. Expected "xx" or "xx-XX" format.`,
			)
		}
		return new Language(parsed.language, parsed.region)
	}

	/**
	 * Static method to create a Language instance from a string (non-throwing variant)
	 * @param code - Language code in either "xx" or "xx-XX" format
	 * @returns Language instance or null if the code is invalid
	 */
	public static readonly tryParse = (code: string): Language | null => {
		const parsed = Language.parseLanguageCode(code)
		if (!parsed) {
			return null
		}
		return new Language(parsed.language, parsed.region)
	}

	/**
	 * Static method to check if a string is a valid language code
	 */
	public static readonly isValid = (code: string): boolean => {
		return Language.parseLanguageCode(code) !== null
	}
}
