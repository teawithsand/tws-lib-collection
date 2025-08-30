import { beforeEach, describe, expect, test } from "vitest"
import { z } from "zod"

import { SerializerUtil } from "@teawithsand/reserd"
import { InMemoryConfigStorage } from "../storage/inMemory"
import { ConfigSpec, ConfigStorageCacheMode } from "../types"
import { ConfigStorageHelper } from "./configStorageHelper"

describe("ConfigStorageHelper", () => {
	type TestConfig = {
		theme: string
		counter: number
		isEnabled: boolean
		settings: {
			lang: string
			notifications: boolean
		}
		customStorageKey: string
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
		customStorageKey: {
			defaultValue: "default-value",
			storageKey: "custom/storage/key",
			serializer: SerializerUtil.fromZodSchema(z.string()),
		},
	}

	let storage: InMemoryConfigStorage
	let helper: ConfigStorageHelper<TestConfig>

	beforeEach(() => {
		storage = new InMemoryConfigStorage()

		helper = new ConfigStorageHelper<TestConfig>({
			spec: testConfigSpec,
			storage,
			cacheMode: ConfigStorageCacheMode.DISABLED,
			storageKeyTransform: (x) => x,
		})
	})

	test("reading a non-persisted field returns default value", async () => {
		// Act
		const theme = await helper.read("theme")
		const counter = await helper.read("counter")
		const isEnabled = await helper.read("isEnabled")
		const settings = await helper.read("settings")

		// Assert
		expect(theme).toBe("light")
		expect(counter).toBe(0)
		expect(isEnabled).toBe(true)
		expect(settings).toEqual({
			lang: "en",
			notifications: true,
		})
	})

	test("writing and reading primitive values persists correctly", async () => {
		// Act
		await helper.write("theme", "dark")
		await helper.write("counter", 42)
		await helper.write("isEnabled", false)

		const theme = await helper.read("theme")
		const counter = await helper.read("counter")
		const isEnabled = await helper.read("isEnabled")

		// Assert
		expect(theme).toBe("dark")
		expect(counter).toBe(42)
		expect(isEnabled).toBe(false)
	})

	test("writing and reading complex objects persists correctly", async () => {
		// Arrange
		const newSettings = {
			lang: "es",
			notifications: false,
		}

		// Act
		await helper.write("settings", newSettings)
		const settings = await helper.read("settings")

		// Assert
		expect(settings).toEqual(newSettings)
	})

	test("field respects explicit storageKey", async () => {
		// Act
		await helper.write("customStorageKey", "test-value")

		// Assert
		const storedValue = await storage.get("custom/storage/key")
		expect(storedValue).toBe("test-value")

		const readValue = await helper.read("customStorageKey")
		expect(readValue).toBe("test-value")
	})

	test("serialization handles type validation through zod schemas", async () => {
		// Arrange
		await helper.write("counter", 123)
		await helper.write("settings", { lang: "fr", notifications: true })

		// Act
		const counter = await helper.read("counter")
		const settings = await helper.read("settings")

		// Assert
		expect(typeof counter).toBe("number")
		expect(counter).toBe(123)
		expect(typeof settings).toBe("object")
		expect(
			(settings as { lang: string; notifications: boolean }).lang,
		).toBe("fr")
		expect(
			(settings as { lang: string; notifications: boolean })
				.notifications,
		).toBe(true)
	})
})
