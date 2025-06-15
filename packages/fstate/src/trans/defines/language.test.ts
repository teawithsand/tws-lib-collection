import { describe, expect, test } from "vitest"
import { Language } from "./language"

describe("Language", () => {
	describe("parse", () => {
		describe("valid language codes", () => {
			test("should parse short format language codes", () => {
				const language = Language.parse("en")

				expect(language.getLanguage()).toBe("en")
				expect(language.getRegion()).toBeUndefined()
				expect(language.toString()).toBe("en")
			})

			test("should parse long format language codes", () => {
				const language = Language.parse("en-US")

				expect(language.getLanguage()).toBe("en")
				expect(language.getRegion()).toBe("US")
				expect(language.toString()).toBe("en-US")
			})

			test("should parse different valid language codes", () => {
				const testCases = [
					{
						code: "pl",
						expectedLang: "pl",
						expectedRegion: undefined,
					},
					{
						code: "fr",
						expectedLang: "fr",
						expectedRegion: undefined,
					},
					{ code: "de-DE", expectedLang: "de", expectedRegion: "DE" },
					{ code: "ja-JP", expectedLang: "ja", expectedRegion: "JP" },
					{ code: "zh-CN", expectedLang: "zh", expectedRegion: "CN" },
				]

				testCases.forEach(({ code, expectedLang, expectedRegion }) => {
					const language = Language.parse(code)
					expect(language.getLanguage()).toBe(expectedLang)
					expect(language.getRegion()).toBe(expectedRegion)
				})
			})

			test("should handle whitespace correctly", () => {
				const language1 = Language.parse("  en  ")
				const language2 = Language.parse("  en-US  ")

				expect(language1.getLanguage()).toBe("en")
				expect(language1.getRegion()).toBeUndefined()
				expect(language2.getLanguage()).toBe("en")
				expect(language2.getRegion()).toBe("US")
			})

			test("should handle case-insensitive input and normalize case", () => {
				const testCases = [
					{
						input: "EN",
						expectedLang: "en",
						expectedRegion: undefined,
					},
					{
						input: "En",
						expectedLang: "en",
						expectedRegion: undefined,
					},
					{
						input: "eN",
						expectedLang: "en",
						expectedRegion: undefined,
					},
					{
						input: "en-us",
						expectedLang: "en",
						expectedRegion: "US",
					},
					{
						input: "EN-US",
						expectedLang: "en",
						expectedRegion: "US",
					},
					{
						input: "En-Us",
						expectedLang: "en",
						expectedRegion: "US",
					},
					{
						input: "eN-uS",
						expectedLang: "en",
						expectedRegion: "US",
					},
					{
						input: "FR-fr",
						expectedLang: "fr",
						expectedRegion: "FR",
					},
					{
						input: "de-DE",
						expectedLang: "de",
						expectedRegion: "DE",
					},
				]

				testCases.forEach(({ input, expectedLang, expectedRegion }) => {
					const language = Language.parse(input)
					expect(language.getLanguage()).toBe(expectedLang)
					expect(language.getRegion()).toBe(expectedRegion)
					if (expectedRegion) {
						expect(language.toString()).toBe(
							`${expectedLang}-${expectedRegion}`,
						)
					} else {
						expect(language.toString()).toBe(expectedLang)
					}
				})
			})
		})

		describe("invalid language codes", () => {
			test("should throw error for invalid format codes", () => {
				const invalidCodes = [
					"",
					"   ",
					"e",
					"eng",
					"en_US",
					"en-USA",
					"123",
					"en-12",
					"12-US",
					"en-U",
					"e-US",
					"en-",
				]

				invalidCodes.forEach((code) => {
					expect(() => Language.parse(code)).toThrow(
						`Invalid language code format: ${code}. Expected "xx" or "xx-XX" format.`,
					)
				})
			})

			test("should throw error for null and undefined inputs", () => {
				expect(() => Language.parse(null as any)).toThrow()
				expect(() => Language.parse(undefined as any)).toThrow()
			})
		})
	})

	describe("tryParse", () => {
		describe("valid language codes", () => {
			test("should parse valid short format language codes", () => {
				const language = Language.tryParse("en")

				expect(language).not.toBeNull()
				expect(language!.getLanguage()).toBe("en")
				expect(language!.getRegion()).toBeUndefined()
			})

			test("should parse valid long format language codes", () => {
				const language = Language.tryParse("en-US")

				expect(language).not.toBeNull()
				expect(language!.getLanguage()).toBe("en")
				expect(language!.getRegion()).toBe("US")
			})

			test("should handle whitespace correctly", () => {
				const language1 = Language.tryParse("  pl  ")
				const language2 = Language.tryParse("  fr-FR  ")

				expect(language1).not.toBeNull()
				expect(language1!.getLanguage()).toBe("pl")
				expect(language2).not.toBeNull()
				expect(language2!.getLanguage()).toBe("fr")
				expect(language2!.getRegion()).toBe("FR")
			})

			test("should handle case-insensitive input and normalize case", () => {
				const testCases = [
					{
						input: "EN",
						expectedLang: "en",
						expectedRegion: undefined,
					},
					{
						input: "en-us",
						expectedLang: "en",
						expectedRegion: "US",
					},
					{
						input: "FR-fr",
						expectedLang: "fr",
						expectedRegion: "FR",
					},
					{
						input: "De-dE",
						expectedLang: "de",
						expectedRegion: "DE",
					},
				]

				testCases.forEach(({ input, expectedLang, expectedRegion }) => {
					const language = Language.tryParse(input)
					expect(language).not.toBeNull()
					expect(language!.getLanguage()).toBe(expectedLang)
					expect(language!.getRegion()).toBe(expectedRegion)
				})
			})
		})

		describe("invalid language codes", () => {
			test("should return null for invalid format codes", () => {
				const invalidCodes = [
					"",
					"   ",
					"e",
					"eng",
					"en_US",
					"en-USA",
					"123",
					"en-12",
					"12-US",
				]

				invalidCodes.forEach((code) => {
					expect(Language.tryParse(code)).toBeNull()
				})
			})

			test("should return null for null and undefined inputs", () => {
				expect(Language.tryParse(null as any)).toBeNull()
				expect(Language.tryParse(undefined as any)).toBeNull()
			})
		})
	})

	describe("isValid", () => {
		test("should return true for valid language codes", () => {
			const validCodes = [
				"en",
				"pl",
				"fr",
				"de",
				"ja",
				"zh",
				"en-US",
				"fr-FR",
				"de-DE",
				"ja-JP",
				"zh-CN",
				"  en  ",
				"  en-US  ",
				"EN",
				"en-us",
				"FR-fr",
				"De-dE",
			]

			validCodes.forEach((code) => {
				expect(Language.isValid(code)).toBe(true)
			})
		})

		test("should return false for invalid language codes", () => {
			const invalidCodes = [
				"",
				"   ",
				"e",
				"eng",
				"en_US",
				"en-USA",
				"123",
				"en-12",
				"12-US",
				null as any,
				undefined as any,
			]

			invalidCodes.forEach((code) => {
				expect(Language.isValid(code)).toBe(false)
			})
		})
	})

	describe("instance methods", () => {
		describe("getLanguage", () => {
			test("should return language code for short format", () => {
				const language = Language.parse("en")
				expect(language.getLanguage()).toBe("en")
			})

			test("should return language code for long format", () => {
				const language = Language.parse("en-US")
				expect(language.getLanguage()).toBe("en")
			})
		})

		describe("getRegion", () => {
			test("should return undefined for short format", () => {
				const language = Language.parse("en")
				expect(language.getRegion()).toBeUndefined()
			})

			test("should return region code for long format", () => {
				const language = Language.parse("en-US")
				expect(language.getRegion()).toBe("US")
			})
		})

		describe("toString", () => {
			test("should return short format when no region", () => {
				const language = Language.parse("en")
				expect(language.toString()).toBe("en")
			})

			test("should return long format when region is present", () => {
				const language = Language.parse("en-US")
				expect(language.toString()).toBe("en-US")
			})
		})

		describe("toShortFormat", () => {
			test("should always return language code only", () => {
				const shortLanguage = Language.parse("en")
				const longLanguage = Language.parse("en-US")

				expect(shortLanguage.toShortFormat()).toBe("en")
				expect(longLanguage.toShortFormat()).toBe("en")
			})
		})

		describe("toLongFormat", () => {
			test("should return undefined when no region", () => {
				const language = Language.parse("en")
				expect(language.toLongFormat()).toBeUndefined()
			})

			test("should return long format when region is present", () => {
				const language = Language.parse("en-US")
				expect(language.toLongFormat()).toBe("en-US")
			})
		})

		describe("hasRegion", () => {
			test("should return false for short format languages", () => {
				const language = Language.parse("en")
				expect(language.hasRegion()).toBe(false)
			})

			test("should return true for long format languages", () => {
				const language = Language.parse("en-US")
				expect(language.hasRegion()).toBe(true)
			})
		})

		describe("matches", () => {
			test("should match same language codes without regions", () => {
				const lang1 = Language.parse("en")
				const lang2 = Language.parse("en")

				expect(lang1.matches(lang2)).toBe(true)
				expect(lang2.matches(lang1)).toBe(true)
			})

			test("should match same language codes with same regions", () => {
				const lang1 = Language.parse("en-US")
				const lang2 = Language.parse("en-US")

				expect(lang1.matches(lang2)).toBe(true)
				expect(lang2.matches(lang1)).toBe(true)
			})

			test("should match same language with one having region and other not", () => {
				const langShort = Language.parse("en")
				const langLong = Language.parse("en-US")

				expect(langShort.matches(langLong)).toBe(true)
				expect(langLong.matches(langShort)).toBe(true)
			})

			test("should not match different languages", () => {
				const lang1 = Language.parse("en")
				const lang2 = Language.parse("fr")

				expect(lang1.matches(lang2)).toBe(false)
				expect(lang2.matches(lang1)).toBe(false)
			})

			test("should not match same language with different regions", () => {
				const lang1 = Language.parse("en-US")
				const lang2 = Language.parse("en-GB")

				expect(lang1.matches(lang2)).toBe(false)
				expect(lang2.matches(lang1)).toBe(false)
			})

			test("should work with static language constants", () => {
				const english = Language.parse("en")
				const englishUs = Language.parse("en-US")
				const polishPl = Language.parse("pl-PL")

				expect(english.matches(Language.ENGLISH_US)).toBe(true)
				expect(Language.ENGLISH_US.matches(english)).toBe(true)
				expect(englishUs.matches(Language.ENGLISH_US)).toBe(true)
				expect(polishPl.matches(Language.POLISH)).toBe(true)
				expect(Language.POLISH.matches(Language.FRENCH)).toBe(false)
			})
		})

		describe("equals", () => {
			test("should return true for identical languages without regions", () => {
				const lang1 = Language.parse("en")
				const lang2 = Language.parse("en")

				expect(lang1.equals(lang2)).toBe(true)
				expect(lang2.equals(lang1)).toBe(true)
			})

			test("should return true for identical languages with same regions", () => {
				const lang1 = Language.parse("en-US")
				const lang2 = Language.parse("en-US")

				expect(lang1.equals(lang2)).toBe(true)
				expect(lang2.equals(lang1)).toBe(true)
			})

			test("should return false for same language with different regions", () => {
				const lang1 = Language.parse("en-US")
				const lang2 = Language.parse("en-GB")

				expect(lang1.equals(lang2)).toBe(false)
				expect(lang2.equals(lang1)).toBe(false)
			})

			test("should return false for same language with one having region and other not", () => {
				const langShort = Language.parse("en")
				const langLong = Language.parse("en-US")

				expect(langShort.equals(langLong)).toBe(false)
				expect(langLong.equals(langShort)).toBe(false)
			})

			test("should return false for different languages", () => {
				const lang1 = Language.parse("en")
				const lang2 = Language.parse("fr")

				expect(lang1.equals(lang2)).toBe(false)
				expect(lang2.equals(lang1)).toBe(false)
			})

			test("should return false for different languages with regions", () => {
				const lang1 = Language.parse("en-US")
				const lang2 = Language.parse("fr-FR")

				expect(lang1.equals(lang2)).toBe(false)
				expect(lang2.equals(lang1)).toBe(false)
			})

			test("should work with static language constants", () => {
				const english = Language.parse("en")
				const englishUs = Language.parse("en-US")
				const polishPl = Language.parse("pl-PL")

				expect(englishUs.equals(Language.ENGLISH_US)).toBe(true)
				expect(Language.ENGLISH_US.equals(englishUs)).toBe(true)
				expect(polishPl.equals(Language.POLISH)).toBe(true)
				expect(Language.POLISH.equals(polishPl)).toBe(true)
				expect(english.equals(Language.ENGLISH_US)).toBe(false)
				expect(Language.POLISH.equals(Language.FRENCH)).toBe(false)
			})

			test("should distinguish between matches and equals behavior", () => {
				const langShort = Language.parse("en")
				const langLong = Language.parse("en-US")

				// matches() should return true (language matches, region ignored)
				expect(langShort.matches(langLong)).toBe(true)
				expect(langLong.matches(langShort)).toBe(true)

				// equals() should return false (structural comparison requires exact match)
				expect(langShort.equals(langLong)).toBe(false)
				expect(langLong.equals(langShort)).toBe(false)
			})
		})
	})

	describe("edge cases and boundary conditions", () => {
		test("should handle all lowercase language codes", () => {
			const language = Language.parse("ab")
			expect(language.getLanguage()).toBe("ab")
		})

		test("should handle all uppercase region codes", () => {
			const language = Language.parse("ab-CD")
			expect(language.getRegion()).toBe("CD")
		})

		test("should handle languages at alphabet boundaries", () => {
			const testCases = ["aa", "zz", "aa-AA", "zz-ZZ"]

			testCases.forEach((code) => {
				expect(() => Language.parse(code)).not.toThrow()
				expect(Language.isValid(code)).toBe(true)
			})
		})
	})

	describe("Static Language Constants", () => {
		test("should have correct language constants", () => {
			expect(Language.POLISH.getLanguage()).toBe("pl")
			expect(Language.POLISH.getRegion()).toBe("PL")
			expect(Language.POLISH.toString()).toBe("pl-PL")

			expect(Language.ENGLISH_US.getLanguage()).toBe("en")
			expect(Language.ENGLISH_US.getRegion()).toBe("US")
			expect(Language.ENGLISH_US.toString()).toBe("en-US")

			expect(Language.RUSSIAN.getLanguage()).toBe("ru")
			expect(Language.RUSSIAN.getRegion()).toBe("RU")
			expect(Language.RUSSIAN.toString()).toBe("ru-RU")

			expect(Language.FRENCH.getLanguage()).toBe("fr")
			expect(Language.FRENCH.getRegion()).toBe("FR")
			expect(Language.FRENCH.toString()).toBe("fr-FR")
		})
	})
})
