import { NoOpRwLockAdapterMap, QueueRwLockAdapter } from "@teawithsand/lngext"
import { SerializerUtil } from "@teawithsand/reserd"
import { beforeEach, describe, expect, test } from "vitest"
import { z } from "zod"
import { createStore, JotaiStore } from "../../libs"
import { ConfigFieldMismatchError, ConfigUnknownFieldError } from "../errors"
import { InMemoryConfigStorage } from "../storage/inMemory"
import { ConfigSpec, ConfigStorageCacheMode } from "../types"
import { ConfigImpl } from "./config"

type TestConfig = {
	theme: string
	counter: number
	isEnabled: boolean
	settings: {
		lang: string
		notifications: boolean
	}
}

const testConfigSpec: ConfigSpec<TestConfig> = {
	theme: {
		defaultValue: "light",
		serializer: SerializerUtil.fromZodSchema(z.string()),
	},
	counter: {
		defaultValue: 0,
		serializer: SerializerUtil.fromZodSchema(z.number()),
	},
	isEnabled: {
		defaultValue: true,
		serializer: SerializerUtil.fromZodSchema(z.boolean()),
	},
	settings: {
		defaultValue: {
			lang: "en",
			notifications: true,
		},
		serializer: SerializerUtil.fromZodSchema(
			z.object({
				lang: z.string(),
				notifications: z.boolean(),
			}),
		),
	},
}

describe("ConfigImpl", () => {
	let storage: InMemoryConfigStorage
	let store: JotaiStore
	let config: ConfigImpl<TestConfig>

	beforeEach(() => {
		storage = new InMemoryConfigStorage()
		store = createStore()

		config = new ConfigImpl({
			store,
			spec: testConfigSpec,
			storage,
			rwLockAdapterMap: new NoOpRwLockAdapterMap(),
			globalLock: new QueueRwLockAdapter(),
			cacheMode: ConfigStorageCacheMode.DISABLED,
		})
	})

	test("should return default values for unset fields", async () => {
		// Act
		const theme = await config.getField("theme")
		const counter = await config.getField("counter")
		const isEnabled = await config.getField("isEnabled")
		const settings = await config.getField("settings")

		// Assert
		expect(theme).toBe("light")
		expect(counter).toBe(0)
		expect(isEnabled).toBe(true)
		expect(settings).toEqual({
			lang: "en",
			notifications: true,
		})
	})

	test("should persist and retrieve field values", async () => {
		// Act
		await config.setField("theme", "dark")
		await config.setField("counter", 42)
		await config.setField("isEnabled", false)
		await config.setField("settings", {
			lang: "es",
			notifications: false,
		})

		// Assert
		expect(await config.getField("theme")).toBe("dark")
		expect(await config.getField("counter")).toBe(42)
		expect(await config.getField("isEnabled")).toBe(false)
		expect(await config.getField("settings")).toEqual({
			lang: "es",
			notifications: false,
		})
	})

	test("should load all fields at once", async () => {
		// Arrange
		await config.setField("theme", "dark")
		await config.setField("counter", 123)

		// Act
		const allFields = await config.loadAllFields()

		// Assert
		expect(allFields).toEqual({
			theme: "dark",
			counter: 123,
			isEnabled: true, // default value
			settings: {
				lang: "en",
				notifications: true,
			}, // default value
		})
	})

	test("should update multiple fields atomically via updateConfig", async () => {
		// Arrange
		await config.setField("theme", "light")
		await config.setField("counter", 5)

		// Act
		await config.updateConfig((currentConfig) => ({
			...currentConfig,
			theme: "dark",
			counter: currentConfig.counter + 10,
		}))

		// Assert
		expect(await config.getField("theme")).toBe("dark")
		expect(await config.getField("counter")).toBe(15)
		expect(await config.getField("isEnabled")).toBe(true) // unchanged
	})

	test("should update atoms when fields are set", async () => {
		// Act
		await config.setField("theme", "dark")

		// Assert
		const consistentTheme = await store.get(config.consistentAtoms.theme)
		const eventuallyConsistentTheme = store.get(
			config.eventuallyConsistentAtoms.theme,
		)

		expect(consistentTheme).toBe("dark")
		expect(eventuallyConsistentTheme).toBe("dark")
	})

	test("should update atoms when config is updated via updateConfig", async () => {
		// Arrange
		await config.setField("counter", 10)

		// Act
		await config.updateConfig((current) => ({
			...current,
			counter: 25,
			theme: "purple",
		}))

		// Assert
		const consistentCounter = await store.get(
			config.consistentAtoms.counter,
		)
		const consistentTheme = await store.get(config.consistentAtoms.theme)
		const eventuallyConsistentCounter = store.get(
			config.eventuallyConsistentAtoms.counter,
		)
		const eventuallyConsistentTheme = store.get(
			config.eventuallyConsistentAtoms.theme,
		)

		expect(consistentCounter).toBe(25)
		expect(consistentTheme).toBe("purple")
		expect(eventuallyConsistentCounter).toBe(25)
		expect(eventuallyConsistentTheme).toBe("purple")
	})

	test("should provide access to atoms", async () => {
		// Act
		await config.setField("theme", "dark")

		// Assert - Check that atoms are accessible and have correct structure
		expect(config.consistentAtoms.theme).toBeDefined()
		expect(config.eventuallyConsistentAtoms.theme).toBeDefined()
		expect(config.consistentLoadableAtoms.theme).toBeDefined()

		// Check that consistent atom resolves to correct value
		const consistentTheme = await store.get(config.consistentAtoms.theme)
		expect(consistentTheme).toBe("dark")

		// Check that eventually consistent atom has correct value
		const eventuallyConsistentTheme = store.get(
			config.eventuallyConsistentAtoms.theme,
		)
		expect(eventuallyConsistentTheme).toBe("dark")
	})

	describe("assertFieldsConfigured", () => {
		test("should pass with all required fields", () => {
			// Act & Assert
			expect(() =>
				config.assertFieldsConfigured({
					theme: undefined,
					counter: undefined,
					isEnabled: undefined,
					settings: undefined,
				}),
			).not.toThrow()
		})

		test("should throw ConfigUnknownFieldError for extra fields", () => {
			// Act & Assert
			expect(() =>
				config.assertFieldsConfigured({
					theme: undefined,
					counter: undefined,
					isEnabled: undefined,
					settings: undefined,
					// @ts-expect-error - testing runtime behavior
					extraField: undefined,
				}),
			).toThrow(ConfigUnknownFieldError)
		})

		test("should throw ConfigFieldMismatchError for missing fields", () => {
			// Act & Assert
			expect(() =>
				config.assertFieldsConfigured({
					theme: undefined,
					// missing other required fields
				}),
			).toThrow(ConfigFieldMismatchError)
		})

		test("should include field names in error messages", () => {
			// Act & Assert
			expect(() =>
				config.assertFieldsConfigured({
					theme: undefined,
					// @ts-expect-error - testing runtime behavior
					extraField: undefined,
				}),
			).toThrow(/extraField/)

			expect(() =>
				config.assertFieldsConfigured({
					theme: undefined,
					// missing other fields
				}),
			).toThrow(/counter|isEnabled|settings/)
		})
	})

	test("should apply storage key transforms", async () => {
		// Arrange
		const transformedConfig = new ConfigImpl({
			store,
			spec: testConfigSpec,
			storage,
			rwLockAdapterMap: new NoOpRwLockAdapterMap(),
			globalLock: new QueueRwLockAdapter(),
			storageKeyTransform: (key) =>
				`prefix_${String(key)}` as keyof TestConfig,
		})

		// Act
		await transformedConfig.setField("theme", "transformed")

		// Assert
		const storedValue = await storage.get("prefix_theme")
		expect(storedValue).toBe("transformed")
	})

	test("should work with different cache modes", async () => {
		// Arrange
		const cachedConfig = new ConfigImpl({
			store,
			spec: testConfigSpec,
			storage,
			rwLockAdapterMap: new NoOpRwLockAdapterMap(),
			globalLock: new QueueRwLockAdapter(),
			cacheMode: ConfigStorageCacheMode.AFTER_WRITE,
		})

		// Act
		await cachedConfig.setField("theme", "cached")
		const retrievedValue = await cachedConfig.getField("theme")

		// Assert
		expect(retrievedValue).toBe("cached")
	})

	test("should handle complex objects correctly", async () => {
		// Arrange
		const complexSettings = {
			lang: "fr",
			notifications: false,
		}

		// Act
		await config.setField("settings", complexSettings)
		const retrieved = await config.getField("settings")

		// Assert
		expect(retrieved).toEqual(complexSettings)
		expect(retrieved).not.toBe(complexSettings) // should be a different object reference
	})

	test("should maintain separate storage per field", async () => {
		// Act
		await config.setField("theme", "dark")
		await config.setField("counter", 100)

		// Assert
		expect(await config.getField("theme")).toBe("dark")
		expect(await config.getField("counter")).toBe(100)
		expect(await config.getField("isEnabled")).toBe(true) // unchanged default
	})
})
