import { createStore } from "jotai"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { Language } from "../defines"
import { BrowserLanguageAtomProvider } from "./browserLanguageAtom"

describe("BrowserLanguageAtomProvider", () => {
	let store: ReturnType<typeof createStore>
	let originalWindow: typeof globalThis.window
	let originalNavigator: typeof globalThis.navigator

	const setupMockEnvironment = (
		navigator: any,
		window: any = {
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		},
	) => {
		Object.defineProperty(globalThis, "navigator", {
			value: navigator,
			writable: true,
			configurable: true,
		})
		Object.defineProperty(globalThis, "window", {
			value: window,
			writable: true,
			configurable: true,
		})
	}

	beforeEach(() => {
		store = createStore()
		originalWindow = globalThis.window
		originalNavigator = globalThis.navigator
		vi.clearAllMocks()
	})

	afterEach(() => {
		Object.defineProperty(globalThis, "window", {
			value: originalWindow,
			writable: true,
			configurable: true,
		})
		Object.defineProperty(globalThis, "navigator", {
			value: originalNavigator,
			writable: true,
			configurable: true,
		})
		vi.restoreAllMocks()
	})

	describe("createAtom", () => {
		test("returns undefined when window unavailable", () => {
			setupMockEnvironment(undefined, undefined)
			expect(
				store.get(BrowserLanguageAtomProvider.createLanguageAtom()),
			).toBeUndefined()
		})

		test("returns undefined when navigator unavailable", () => {
			setupMockEnvironment(undefined, {
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
			})
			expect(
				store.get(BrowserLanguageAtomProvider.createLanguageAtom()),
			).toBeUndefined()
		})

		test("parses valid language codes", () => {
			setupMockEnvironment({ language: "en-US" })
			const result = store.get(
				BrowserLanguageAtomProvider.createLanguageAtom(),
			)
			expect(result?.toString()).toBe("en-US")
			expect(result?.getLanguage()).toBe("en")
			expect(result?.getRegion()).toBe("US")
		})

		test("handles invalid language codes", () => {
			setupMockEnvironment({ language: "invalid-code" })
			expect(
				store.get(BrowserLanguageAtomProvider.createLanguageAtom()),
			).toBeUndefined()
		})

		test("manages language change events", () => {
			const mockNavigator = { language: "en-US" }
			const addEventListenerSpy = vi.fn()
			const removeEventListenerSpy = vi.fn()
			let languageChangeHandler: (() => void) | undefined

			setupMockEnvironment(mockNavigator, {
				addEventListener: vi.fn((event, handler) => {
					if (event === "languagechange")
						languageChangeHandler = handler
					addEventListenerSpy(event, handler)
				}),
				removeEventListener: removeEventListenerSpy,
				onlanguagechange: null,
			})

			const atom = BrowserLanguageAtomProvider.createLanguageAtom()
			let currentValue = store.get(atom)
			const unsubscribe = store.sub(atom, () => {
				currentValue = store.get(atom)
			})

			expect(addEventListenerSpy).toHaveBeenCalledWith(
				"languagechange",
				expect.any(Function),
			)

			mockNavigator.language = "fr-FR"
			languageChangeHandler?.()
			expect(currentValue?.toString()).toBe("fr-FR")

			unsubscribe()
			expect(removeEventListenerSpy).toHaveBeenCalledWith(
				"languagechange",
				expect.any(Function),
			)
		})

		test("skips event listener when not supported", () => {
			const addEventListenerSpy = vi.fn()
			setupMockEnvironment(
				{ language: "en-US" },
				{
					addEventListener: addEventListenerSpy,
					removeEventListener: vi.fn(),
				},
			)

			const atom = BrowserLanguageAtomProvider.createLanguageAtom()
			store.sub(atom, () => {})

			expect(addEventListenerSpy).not.toHaveBeenCalled()
		})
	})

	describe("createLanguagesAtom", () => {
		test("returns empty array when browser context unavailable", () => {
			setupMockEnvironment(undefined, undefined)
			expect(
				store.get(BrowserLanguageAtomProvider.createLanguagesAtom()),
			).toEqual([])

			setupMockEnvironment({})
			expect(
				store.get(BrowserLanguageAtomProvider.createLanguagesAtom()),
			).toEqual([])

			setupMockEnvironment({ languages: [] })
			expect(
				store.get(BrowserLanguageAtomProvider.createLanguagesAtom()),
			).toEqual([])
		})

		test("parses valid languages and filters invalid ones", () => {
			setupMockEnvironment({
				languages: ["en-US", "invalid", "fr-FR", "bad-code", "es"],
			})
			const result = store.get(
				BrowserLanguageAtomProvider.createLanguagesAtom(),
			)

			expect(result).toHaveLength(3)
			expect(result[0]?.toString()).toBe("en-US")
			expect(result[1]?.toString()).toBe("fr-FR")
			expect(result[2]?.toString()).toBe("es")
		})

		test("handles language change events", () => {
			const mockNavigator = { languages: ["en-US", "fr-FR"] }
			let languageChangeHandler: (() => void) | undefined
			const addEventListenerSpy = vi.fn()
			const removeEventListenerSpy = vi.fn()

			setupMockEnvironment(mockNavigator, {
				addEventListener: vi.fn((event, handler) => {
					if (event === "languagechange")
						languageChangeHandler = handler as () => void
					addEventListenerSpy(event, handler)
				}),
				removeEventListener: removeEventListenerSpy,
				onlanguagechange: null,
			})

			const atom = BrowserLanguageAtomProvider.createLanguagesAtom()
			let currentValue = store.get(atom)
			const unsubscribe = store.sub(atom, () => {
				currentValue = store.get(atom)
			})

			expect(addEventListenerSpy).toHaveBeenCalledWith(
				"languagechange",
				expect.any(Function),
			)

			mockNavigator.languages = ["de-DE", "it-IT"]
			languageChangeHandler?.()
			expect(currentValue).toHaveLength(2)
			expect(currentValue[0]?.toString()).toBe("de-DE")

			unsubscribe()
			expect(removeEventListenerSpy).toHaveBeenCalledWith(
				"languagechange",
				expect.any(Function),
			)
		})

		test("skips event listener when not supported", () => {
			const addEventListenerSpy = vi.fn()
			setupMockEnvironment(
				{ languages: ["en-US"] },
				{
					addEventListener: addEventListenerSpy,
					removeEventListener: vi.fn(),
				},
			)

			const atom = BrowserLanguageAtomProvider.createLanguagesAtom()
			store.sub(atom, () => {})

			expect(addEventListenerSpy).not.toHaveBeenCalled()
		})

		test("handles parsing exceptions gracefully", () => {
			setupMockEnvironment({ languages: ["en-US"] })
			vi.spyOn(Language, "tryParse").mockImplementation(() => {
				throw new Error("Parse error")
			})

			const atom = BrowserLanguageAtomProvider.createLanguagesAtom()
			expect(store.get(atom)).toEqual([])
		})
	})
})
