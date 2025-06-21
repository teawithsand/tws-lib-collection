import { LockImpl, QueueLockAdapter } from "@teawithsand/lngext"
import { EncoderUtil, JsonEncoder, SerializerUtil } from "@teawithsand/reserd"
import { createStore } from "jotai"
import { describe, expect, test } from "vitest"
import { z } from "zod"
import { ConfigImpl, InMemoryConfigStorage } from "./index"

const stringSerializer = SerializerUtil.fromZodSchemaChecked(z.string())

const numberSerializer = SerializerUtil.fromZodSchemaChecked(z.number())

const booleanSerializer = SerializerUtil.fromZodSchemaChecked(z.boolean())

const jsonSerializer = <T>(schema: z.ZodSchema<T>) =>
	SerializerUtil.fromZodSchemaChecked(schema)

interface AppConfig extends Record<string, unknown> {
	theme: "light" | "dark"
	fontSize: number
	autoSave: boolean
	userPreferences: {
		language: string
		notifications: boolean
	}
}

const userPreferencesSchema = z.object({
	language: z.string(),
	notifications: z.boolean(),
})

const themeSerializer = {
	serialize: (value: "light" | "dark") => value,
	deserialize: (stored: unknown): "light" | "dark" => {
		if (stored === "light" || stored === "dark") {
			return stored
		}
		return "light"
	},
}

describe("Config", () => {
	test("should create config with builder pattern", async () => {
		const storage = new InMemoryConfigStorage()
		const store = createStore()

		const config = ConfigImpl.builder<AppConfig>()
			.addField("theme", "light", themeSerializer)
			.addField("fontSize", 16, numberSerializer)
			.addField("autoSave", true, booleanSerializer)
			.addField(
				"userPreferences",
				{ language: "en", notifications: true },
				jsonSerializer(userPreferencesSchema),
			)
			.setStorage(storage)
			.build({ store, keyPrefix: "app" })

		expect(config).toBeInstanceOf(ConfigImpl)
	})

	test("should handle field updates with lock protection", async () => {
		const storage = new InMemoryConfigStorage()
		const store = createStore()
		const lock = new LockImpl(new QueueLockAdapter())

		const config = ConfigImpl.builder<AppConfig>()
			.addField("theme", "light", themeSerializer)
			.addField("fontSize", 16, numberSerializer)
			.addField("autoSave", true, booleanSerializer)
			.addField(
				"userPreferences",
				{ language: "en", notifications: true },
				jsonSerializer(userPreferencesSchema),
			)
			.setStorage(storage)
			.build({ store, lock })

		await config.setField("theme", "dark")
		const loadedTheme = await config.loadField("theme")
		expect(loadedTheme).toBe("dark")

		await config.updateConfig((current) => ({
			fontSize: current.fontSize + 2,
			autoSave: false,
		}))

		const loadedFontSize = await config.loadField("fontSize")
		const loadedAutoSave = await config.loadField("autoSave")
		expect(loadedFontSize).toBe(18)
		expect(loadedAutoSave).toBe(false)
	})

	test("should work with jotai atoms", async () => {
		const storage = new InMemoryConfigStorage()
		const store = createStore()

		const config = ConfigImpl.builder<AppConfig>()
			.addField("theme", "light", themeSerializer)
			.addField("fontSize", 16, numberSerializer)
			.addField("autoSave", true, booleanSerializer)
			.addField(
				"userPreferences",
				{ language: "en", notifications: true },
				jsonSerializer(userPreferencesSchema),
			)
			.setStorage(storage)
			.build({ store })

		await config.setField("theme", "dark")
		await config.setField("fontSize", 18)

		const themePromise = store.get(config.consistentConfig.theme)
		const fontSizePromise = store.get(config.consistentConfig.fontSize)

		expect(await themePromise).toBe("dark")
		expect(await fontSizePromise).toBe(18)

		const eventualTheme = store.get(config.eventuallyConsistentConfig.theme)
		const eventualFontSize = store.get(
			config.eventuallyConsistentConfig.fontSize,
		)

		expect(eventualTheme).toBe("dark")
		expect(eventualFontSize).toBe(18)

		const themeLoadable = config.consistentConfigLoadable.theme
		const fontSizeLoadable = config.consistentConfigLoadable.fontSize

		expect(themeLoadable).toBeDefined()
		expect(fontSizeLoadable).toBeDefined()
	})

	test("should handle serialization errors gracefully", async () => {
		const storage = new InMemoryConfigStorage()
		const store = createStore()

		const faultySerializer = {
			serialize: (value: string) => {
				if (value === "error") {
					throw new Error("Serialization error")
				}
				return value
			},
			deserialize: (stored: unknown) => {
				if (stored === "error") {
					throw new Error("Deserialization error")
				}
				return stored as string
			},
		}

		const config = ConfigImpl.builder<{ testField: string }>()
			.addField("testField", "default", faultySerializer)
			.setStorage(storage)
			.build({ store })

		await expect(config.setField("testField", "error")).rejects.toThrow()

		const defaultValue = await config.loadField("testField")
		expect(defaultValue).toBe("default")
	})

	test("should respect custom storage keys", async () => {
		const storage = new InMemoryConfigStorage()
		const store = createStore()

		const config = ConfigImpl.builder<{ testField: string }>()
			.addField("testField", "default", stringSerializer, "custom_key")
			.setStorage(storage)
			.build({ store, keyPrefix: "prefix" })

		await config.setField("testField", "test_value")

		const storedValue = await storage.get("prefix:custom_key")
		expect(storedValue).toBe("test_value")
	})

	test("should handle complex object serialization", async () => {
		const storage = new InMemoryConfigStorage()
		const store = createStore()

		interface ComplexConfig extends Record<string, unknown> {
			nested: {
				array: number[]
				map: Record<string, string>
				date: Date
			}
		}

		const dateSerializer = {
			serialize: (value: Date) => value.toISOString(),
			deserialize: (stored: unknown) => new Date(stored as string),
		}

		const complexSerializer = {
			serialize: (value: ComplexConfig["nested"]) => ({
				array: value.array,
				map: value.map,
				date: dateSerializer.serialize(value.date),
			}),
			deserialize: (stored: unknown) => {
				const data = stored as any
				return {
					array: data.array,
					map: data.map,
					date: dateSerializer.deserialize(data.date),
				}
			},
		}

		const config = ConfigImpl.builder<ComplexConfig>()
			.addField(
				"nested",
				{
					array: [1, 2, 3],
					map: { key1: "value1" },
					date: new Date("2023-01-01"),
				},
				complexSerializer,
			)
			.setStorage(storage)
			.build({ store })

		const testValue = {
			array: [4, 5, 6],
			map: { key2: "value2" },
			date: new Date("2024-01-01"),
		}

		await config.setField("nested", testValue)
		const loaded = await config.loadField("nested")

		expect(loaded.array).toEqual([4, 5, 6])
		expect(loaded.map).toEqual({ key2: "value2" })
		expect(loaded.date).toEqual(new Date("2024-01-01"))
	})

	test("should throw error when deserialization fails", async () => {
		const storage = new InMemoryConfigStorage()
		const store = createStore()

		await storage.set("testField", "invalid-data")

		const config = ConfigImpl.builder<{ testField: string }>()
			.addField("testField", "default", stringSerializer)
			.setStorage(storage)
			.build({ store })

		const corruptedSerializer = {
			serialize: (value: string) => value,
			deserialize: (stored: unknown) => {
				throw new Error("Deserialization failed")
			},
		}

		const corruptedConfig = ConfigImpl.builder<{ testField: string }>()
			.addField("testField", "default", corruptedSerializer)
			.setStorage(storage)
			.build({ store })

		await expect(corruptedConfig.loadField("testField")).rejects.toThrow(
			"Failed to load config field testField: Deserialization failed",
		)
	})

	test("should load all fields at once", async () => {
		const storage = new InMemoryConfigStorage()
		const store = createStore()

		const config = ConfigImpl.builder<AppConfig>()
			.addField("theme", "light", themeSerializer)
			.addField("fontSize", 16, numberSerializer)
			.addField("autoSave", true, booleanSerializer)
			.addField(
				"userPreferences",
				{ language: "en", notifications: true },
				jsonSerializer(userPreferencesSchema),
			)
			.setStorage(storage)
			.build({ store })

		await config.setField("theme", "dark")
		await config.setField("fontSize", 18)
		await config.setField("autoSave", false)
		await config.setField("userPreferences", {
			language: "fr",
			notifications: false,
		})

		const allFields = await config.loadAllFields()

		expect(allFields.theme).toBe("dark")
		expect(allFields.fontSize).toBe(18)
		expect(allFields.autoSave).toBe(false)
		expect(allFields.userPreferences).toEqual({
			language: "fr",
			notifications: false,
		})
	})

	test("should load all fields with defaults when not stored", async () => {
		const storage = new InMemoryConfigStorage()
		const store = createStore()

		const config = ConfigImpl.builder<AppConfig>()
			.addField("theme", "light", themeSerializer)
			.addField("fontSize", 16, numberSerializer)
			.addField("autoSave", true, booleanSerializer)
			.addField(
				"userPreferences",
				{ language: "en", notifications: true },
				jsonSerializer(userPreferencesSchema),
			)
			.setStorage(storage)
			.build({ store })

		const allFields = await config.loadAllFields()

		expect(allFields.theme).toBe("light")
		expect(allFields.fontSize).toBe(16)
		expect(allFields.autoSave).toBe(true)
		expect(allFields.userPreferences).toEqual({
			language: "en",
			notifications: true,
		})
	})

	test("should load all fields with mix of stored and default values", async () => {
		const storage = new InMemoryConfigStorage()
		const store = createStore()

		const config = ConfigImpl.builder<AppConfig>()
			.addField("theme", "light", themeSerializer)
			.addField("fontSize", 16, numberSerializer)
			.addField("autoSave", true, booleanSerializer)
			.addField(
				"userPreferences",
				{ language: "en", notifications: true },
				jsonSerializer(userPreferencesSchema),
			)
			.setStorage(storage)
			.build({ store })

		await config.setField("theme", "dark")
		await config.setField("fontSize", 20)

		const allFields = await config.loadAllFields()

		expect(allFields.theme).toBe("dark")
		expect(allFields.fontSize).toBe(20)
		expect(allFields.autoSave).toBe(true)
		expect(allFields.userPreferences).toEqual({
			language: "en",
			notifications: true,
		})
	})

	test("should reflect setField changes in both consistent and eventually consistent configs", async () => {
		const storage = new InMemoryConfigStorage()
		const store = createStore()

		const config = ConfigImpl.builder<AppConfig>()
			.addField("theme", "light", themeSerializer)
			.addField("fontSize", 16, numberSerializer)
			.addField("autoSave", true, booleanSerializer)
			.addField(
				"userPreferences",
				{ language: "en", notifications: true },
				jsonSerializer(userPreferencesSchema),
			)
			.setStorage(storage)
			.build({ store })

		const initialEventualTheme = store.get(
			config.eventuallyConsistentConfig.theme,
		)
		const initialEventualFontSize = store.get(
			config.eventuallyConsistentConfig.fontSize,
		)
		expect(initialEventualTheme).toBe("light")
		expect(initialEventualFontSize).toBe(16)

		await config.setField("theme", "dark")
		await config.setField("fontSize", 20)

		const updatedEventualTheme = store.get(
			config.eventuallyConsistentConfig.theme,
		)
		const updatedEventualFontSize = store.get(
			config.eventuallyConsistentConfig.fontSize,
		)
		expect(updatedEventualTheme).toBe("dark")
		expect(updatedEventualFontSize).toBe(20)

		const consistentTheme = await store.get(config.consistentConfig.theme)
		const consistentFontSize = await store.get(
			config.consistentConfig.fontSize,
		)
		expect(consistentTheme).toBe("dark")
		expect(consistentFontSize).toBe(20)

		const directLoadTheme = await config.loadField("theme")
		const directLoadFontSize = await config.loadField("fontSize")
		expect(directLoadTheme).toBe("dark")
		expect(directLoadFontSize).toBe(20)
	})

	test("should reflect updateConfig changes in both consistent and eventually consistent configs", async () => {
		const storage = new InMemoryConfigStorage()
		const store = createStore()

		const config = ConfigImpl.builder<AppConfig>()
			.addField("theme", "light", themeSerializer)
			.addField("fontSize", 16, numberSerializer)
			.addField("autoSave", true, booleanSerializer)
			.addField(
				"userPreferences",
				{ language: "en", notifications: true },
				jsonSerializer(userPreferencesSchema),
			)
			.setStorage(storage)
			.build({ store })

		await config.setField("theme", "dark")
		await config.setField("fontSize", 18)

		const beforeUpdateEventualTheme = store.get(
			config.eventuallyConsistentConfig.theme,
		)
		const beforeUpdateEventualFontSize = store.get(
			config.eventuallyConsistentConfig.fontSize,
		)
		const beforeUpdateEventualAutoSave = store.get(
			config.eventuallyConsistentConfig.autoSave,
		)

		expect(beforeUpdateEventualTheme).toBe("dark")
		expect(beforeUpdateEventualFontSize).toBe(18)
		expect(beforeUpdateEventualAutoSave).toBe(true)

		await config.updateConfig((current) => ({
			fontSize: current.fontSize + 4,
			autoSave: false,
			userPreferences: {
				language: "fr",
				notifications: false,
			},
		}))

		const afterUpdateEventualTheme = store.get(
			config.eventuallyConsistentConfig.theme,
		)
		const afterUpdateEventualFontSize = store.get(
			config.eventuallyConsistentConfig.fontSize,
		)
		const afterUpdateEventualAutoSave = store.get(
			config.eventuallyConsistentConfig.autoSave,
		)
		const afterUpdateEventualPrefs = store.get(
			config.eventuallyConsistentConfig.userPreferences,
		)

		expect(afterUpdateEventualTheme).toBe("dark")
		expect(afterUpdateEventualFontSize).toBe(22)
		expect(afterUpdateEventualAutoSave).toBe(false)
		expect(afterUpdateEventualPrefs).toEqual({
			language: "fr",
			notifications: false,
		})

		const consistentTheme = await store.get(config.consistentConfig.theme)
		const consistentFontSize = await store.get(
			config.consistentConfig.fontSize,
		)
		const consistentAutoSave = await store.get(
			config.consistentConfig.autoSave,
		)
		const consistentPrefs = await store.get(
			config.consistentConfig.userPreferences,
		)

		expect(consistentTheme).toBe("dark")
		expect(consistentFontSize).toBe(22)
		expect(consistentAutoSave).toBe(false)
		expect(consistentPrefs).toEqual({
			language: "fr",
			notifications: false,
		})
	})

	test("should maintain consistency between getField and atom values after updates", async () => {
		const storage = new InMemoryConfigStorage()
		const store = createStore()

		const config = ConfigImpl.builder<AppConfig>()
			.addField("theme", "light", themeSerializer)
			.addField("fontSize", 16, numberSerializer)
			.addField("autoSave", true, booleanSerializer)
			.addField(
				"userPreferences",
				{ language: "en", notifications: true },
				jsonSerializer(userPreferencesSchema),
			)
			.setStorage(storage)
			.build({ store })

		await config.setField("theme", "dark")
		await config.setField("fontSize", 24)

		const getFieldTheme = config.getField("theme")
		const getFieldFontSize = config.getField("fontSize")
		const getFieldAutoSave = config.getField("autoSave")

		const eventualTheme = store.get(config.eventuallyConsistentConfig.theme)
		const eventualFontSize = store.get(
			config.eventuallyConsistentConfig.fontSize,
		)
		const eventualAutoSave = store.get(
			config.eventuallyConsistentConfig.autoSave,
		)

		expect(getFieldTheme).toBe(eventualTheme)
		expect(getFieldFontSize).toBe(eventualFontSize)
		expect(getFieldAutoSave).toBe(eventualAutoSave)

		expect(getFieldTheme).toBe("dark")
		expect(getFieldFontSize).toBe(24)
		expect(getFieldAutoSave).toBe(true)

		const consistentTheme = await store.get(config.consistentConfig.theme)
		const consistentFontSize = await store.get(
			config.consistentConfig.fontSize,
		)
		const consistentAutoSave = await store.get(
			config.consistentConfig.autoSave,
		)

		expect(getFieldTheme).toBe(consistentTheme)
		expect(getFieldFontSize).toBe(consistentFontSize)
		expect(getFieldAutoSave).toBe(consistentAutoSave)
	})

	test("should validate field configuration completeness", async () => {
		const storage = new InMemoryConfigStorage()
		const store = createStore()

		const config = ConfigImpl.builder<AppConfig>()
			.addField("theme", "light", themeSerializer)
			.addField("fontSize", 16, numberSerializer)
			.addField("autoSave", true, booleanSerializer)
			.addField(
				"userPreferences",
				{ language: "en", notifications: true },
				jsonSerializer(userPreferencesSchema),
			)
			.setStorage(storage)
			.build({ store })

		// Should pass when all fields are specified
		expect(() =>
			config.assertFieldsConfigured({
				theme: null,
				fontSize: undefined,
				autoSave: null,
				userPreferences: undefined,
			}),
		).not.toThrow()

		// Should throw when missing fields
		expect(() =>
			config.assertFieldsConfigured({
				theme: null,
				fontSize: undefined,
			}),
		).toThrow(
			"Field configuration mismatch: Missing fields: autoSave, userPreferences",
		)

		// Should throw when extra fields are provided
		expect(() =>
			config.assertFieldsConfigured({
				theme: null,
				fontSize: undefined,
				autoSave: null,
				userPreferences: undefined,
				extraField: null,
			} as any),
		).toThrow("Field configuration mismatch: Extra fields: extraField")

		// Should throw when both missing and extra fields
		expect(() =>
			config.assertFieldsConfigured({
				theme: null,
				extraField: null,
			} as any),
		).toThrow(
			"Field configuration mismatch: Missing fields: fontSize, autoSave, userPreferences; Extra fields: extraField",
		)
	})
})
