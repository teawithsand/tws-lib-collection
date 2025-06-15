import { describe, expect, test } from "vitest"
import { Language } from "../defines"
import { TransPickerImpl } from "./picker"

type MockTranslation = {
	language: Language
	content: string
}

describe("TransPickerImpl", () => {
	describe("constructor", () => {
		test("creates instance with valid fallback and translations", () => {
			const fallbackLang = Language.parse("en")
			const translations: MockTranslation[] = [
				{ language: Language.parse("en"), content: "Hello" },
				{ language: Language.parse("es"), content: "Hola" },
			]

			const picker = new TransPickerImpl({
				fallbackLanguage: fallbackLang,
				translations,
			})

			expect(picker).toBeInstanceOf(TransPickerImpl)
		})

		test("throws error when duplicate languages exist", () => {
			const fallbackLang = Language.parse("en")
			const translations: MockTranslation[] = [
				{ language: Language.parse("en"), content: "Hello" },
				{ language: Language.parse("en"), content: "Hello2" },
			]

			expect(
				() =>
					new TransPickerImpl({
						fallbackLanguage: fallbackLang,
						translations,
					}),
			).toThrow("Duplicate languages found in translations")
		})

		test("throws error when fallback language is not in translations", () => {
			const fallbackLang = Language.parse("fr")
			const translations: MockTranslation[] = [
				{ language: Language.parse("en"), content: "Hello" },
				{ language: Language.parse("es"), content: "Hola" },
			]

			expect(
				() =>
					new TransPickerImpl({
						fallbackLanguage: fallbackLang,
						translations,
					}),
			).toThrow("Fallback language must be present in translations")
		})

		test("handles empty translations array", () => {
			const fallbackLang = Language.parse("en")
			const translations: MockTranslation[] = []

			expect(
				() =>
					new TransPickerImpl({
						fallbackLanguage: fallbackLang,
						translations,
					}),
			).toThrow("Fallback language must be present in translations")
		})

		test("handles single translation that is fallback", () => {
			const fallbackLang = Language.parse("en")
			const translations: MockTranslation[] = [
				{ language: Language.parse("en"), content: "Hello" },
			]

			const picker = new TransPickerImpl({
				fallbackLanguage: fallbackLang,
				translations,
			})

			expect(picker).toBeInstanceOf(TransPickerImpl)
		})
	})

	describe("pickTranslation", () => {
		test("returns exact match when available", () => {
			const fallbackLang = Language.parse("en")
			const translations: MockTranslation[] = [
				{ language: Language.parse("en"), content: "Hello" },
				{ language: Language.parse("en-US"), content: "Hello US" },
				{ language: Language.parse("es"), content: "Hola" },
			]

			const picker = new TransPickerImpl({
				fallbackLanguage: fallbackLang,
				translations,
			})

			const result = picker.pickTranslation([Language.parse("en-US")])
			expect(result.content).toBe("Hello US")
		})

		test("returns language match when exact match not available", () => {
			const fallbackLang = Language.parse("en")
			const translations: MockTranslation[] = [
				{ language: Language.parse("en"), content: "Hello" },
				{ language: Language.parse("en-UK"), content: "Hello UK" },
				{ language: Language.parse("es"), content: "Hola" },
			]

			const picker = new TransPickerImpl({
				fallbackLanguage: fallbackLang,
				translations,
			})

			const result = picker.pickTranslation([Language.parse("en-CA")])
			expect(result.content).toBe("Hello")
		})

		test("returns fallback when no language match available", () => {
			const fallbackLang = Language.parse("en")
			const translations: MockTranslation[] = [
				{ language: Language.parse("en"), content: "Hello" },
				{ language: Language.parse("es"), content: "Hola" },
				{ language: Language.parse("fr"), content: "Bonjour" },
			]

			const picker = new TransPickerImpl({
				fallbackLanguage: fallbackLang,
				translations,
			})

			const result = picker.pickTranslation([Language.parse("de")])
			expect(result.content).toBe("Hello")
		})

		test("prefers exact match over language match", () => {
			const fallbackLang = Language.parse("en")
			const translations: MockTranslation[] = [
				{ language: Language.parse("en"), content: "Hello" },
				{ language: Language.parse("en-US"), content: "Hello US" },
				{ language: Language.parse("en-UK"), content: "Hello UK" },
			]

			const picker = new TransPickerImpl({
				fallbackLanguage: fallbackLang,
				translations,
			})

			const result = picker.pickTranslation([Language.parse("en-US")])
			expect(result.content).toBe("Hello US")
		})

		test("handles multiple languages in preference order", () => {
			const fallbackLang = Language.parse("en")
			const translations: MockTranslation[] = [
				{ language: Language.parse("en"), content: "Hello" },
				{ language: Language.parse("es"), content: "Hola" },
				{ language: Language.parse("fr"), content: "Bonjour" },
			]

			const picker = new TransPickerImpl({
				fallbackLanguage: fallbackLang,
				translations,
			})

			const result = picker.pickTranslation([
				Language.parse("de"),
				Language.parse("fr"),
				Language.parse("es"),
			])
			expect(result.content).toBe("Bonjour")
		})

		test("handles fallback as only translation", () => {
			const fallbackLang = Language.parse("en")
			const translations: MockTranslation[] = [
				{ language: Language.parse("en"), content: "Hello" },
			]

			const picker = new TransPickerImpl({
				fallbackLanguage: fallbackLang,
				translations,
			})

			const result = picker.pickTranslation([Language.parse("es")])
			expect(result.content).toBe("Hello")
		})

		test("handles multiple language matches correctly", () => {
			const fallbackLang = Language.parse("en")
			const translations: MockTranslation[] = [
				{ language: Language.parse("en"), content: "Hello" },
				{ language: Language.parse("en-UK"), content: "Hello UK" },
				{ language: Language.parse("en-AU"), content: "Hello AU" },
			]

			const picker = new TransPickerImpl({
				fallbackLanguage: fallbackLang,
				translations,
			})

			const result = picker.pickTranslation([Language.parse("en-CA")])
			expect(result.content).toBe("Hello")
		})

		test("returns different translation objects for different requests", () => {
			const fallbackLang = Language.parse("en")
			const translations: MockTranslation[] = [
				{ language: Language.parse("en"), content: "Hello" },
				{ language: Language.parse("es"), content: "Hola" },
			]

			const picker = new TransPickerImpl({
				fallbackLanguage: fallbackLang,
				translations,
			})

			const result1 = picker.pickTranslation([Language.parse("en")])
			const result2 = picker.pickTranslation([Language.parse("es")])

			expect(result1.content).toBe("Hello")
			expect(result2.content).toBe("Hola")
			expect(result1).not.toBe(result2)
		})

		test("handles empty languages array", () => {
			const fallbackLang = Language.parse("en")
			const translations: MockTranslation[] = [
				{ language: Language.parse("en"), content: "Hello" },
				{ language: Language.parse("es"), content: "Hola" },
			]

			const picker = new TransPickerImpl({
				fallbackLanguage: fallbackLang,
				translations,
			})

			const result = picker.pickTranslation([])
			expect(result.content).toBe("Hello")
		})

		test("handles complex multi-language priority scenarios", () => {
			const fallbackLang = Language.parse("en")
			const translations: MockTranslation[] = [
				{ language: Language.parse("en"), content: "Hello" },
				{ language: Language.parse("en-US"), content: "Hello US" },
				{ language: Language.parse("fr"), content: "Bonjour" },
				{ language: Language.parse("de-DE"), content: "Hallo DE" },
				{ language: Language.parse("es"), content: "Hola" },
			]

			const picker = new TransPickerImpl({
				fallbackLanguage: fallbackLang,
				translations,
			})

			const result1 = picker.pickTranslation([
				Language.parse("fr-CA"),
				Language.parse("en-US"),
				Language.parse("de"),
			])
			expect(result1.content).toBe("Hello US")

			const result2 = picker.pickTranslation([
				Language.parse("fr-FR"),
				Language.parse("de-AT"),
				Language.parse("it"),
			])
			expect(result2.content).toBe("Bonjour")

			const result3 = picker.pickTranslation([
				Language.parse("it"),
				Language.parse("de"),
				Language.parse("en-GB"),
			])
			expect(result3.content).toBe("Hallo DE")

			const result4 = picker.pickTranslation([
				Language.parse("ru"),
				Language.parse("ja"),
				Language.parse("zh"),
			])
			expect(result4.content).toBe("Hello")
		})
	})
})
