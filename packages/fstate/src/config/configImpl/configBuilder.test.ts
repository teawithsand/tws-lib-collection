import { QueueRwLockAdapter, SingleRwLockAdapterMap } from "@teawithsand/lngext"
import { SerializerUtil } from "@teawithsand/reserd"
import { createStore } from "jotai"
import { describe, expect, test } from "vitest"
import { z } from "zod"
import { InMemoryConfigStorage } from "../storage/inMemory"
import { ConfigStorageCacheMode } from "../types"
import { ConfigBuilder } from "./configBuilder"

const themeSchema = z.enum(["light", "dark"])
const numberSchema = z.number()

const themeSerializer = SerializerUtil.fromZodSchema(themeSchema)
const numberSerializer = SerializerUtil.fromZodSchema(numberSchema)

interface AppConfig extends Record<string, unknown> {
	theme: "light" | "dark"
	fontSize: number
}

describe("ConfigBuilder", () => {
	test("basic usage showcase - simple config creation", async () => {
		// Arrange
		const store = createStore()
		const storage = new InMemoryConfigStorage()

		// Act
		const config = ConfigBuilder.create<AppConfig>()
			.addField("theme", "light", themeSerializer)
			.addField("fontSize", 14, numberSerializer)
			.build({
				store,
				storage,
			})

		// Assert
		expect(config).toBeDefined()

		expect(await config.getField("theme")).toBe("light")
		expect(await config.getField("fontSize")).toBe(14)

		await config.setField("theme", "dark")
		expect(await config.getField("theme")).toBe("dark")
	})

	test("advanced usage showcase - config with custom settings", async () => {
		// Arrange
		const store = createStore()
		const storage = new InMemoryConfigStorage()
		const customLockMap = new SingleRwLockAdapterMap(
			new QueueRwLockAdapter(),
		)
		const customGlobalLock = new QueueRwLockAdapter()

		// Act
		const config = ConfigBuilder.create<AppConfig>()
			.addField("theme", "light", themeSerializer, "app_theme")
			.addField("fontSize", 14, numberSerializer)
			.setRwLockAdapterMap(customLockMap)
			.setGlobalLock(customGlobalLock)
			.setCacheMode(ConfigStorageCacheMode.AFTER_WRITE)
			.setStorageKeyTransform(
				(key) => `config_${String(key)}` as keyof AppConfig,
			)
			.setLockKeyTransform(
				(key) => `lock_${String(key)}` as keyof AppConfig,
			)
			.build({
				store,
				storage,
			})

		// Assert
		expect(config).toBeDefined()

		await config.updateConfig((current) => ({
			theme: "dark",
			fontSize: current.fontSize + 2,
		}))

		expect(await config.getField("theme")).toBe("dark")
		expect(await config.getField("fontSize")).toBe(16)
	})

	test("builder validation - requires at least one field", () => {
		// Arrange
		const store = createStore()
		const storage = new InMemoryConfigStorage()

		// Act & Assert
		expect(() => {
			ConfigBuilder.create<AppConfig>().build({
				store,
				storage,
			})
		}).toThrow("At least one field must be specified")
	})

	test("fluent API showcase - method chaining", () => {
		// Arrange
		const store = createStore()
		const storage = new InMemoryConfigStorage()

		// Act
		const builder = ConfigBuilder.create<AppConfig>()
			.addField("theme", "light", themeSerializer)
			.addField("fontSize", 14, numberSerializer)
			.setCacheMode(ConfigStorageCacheMode.READ_AFTER_WRITE)
			.setGlobalLock(new QueueRwLockAdapter())
			.setRwLockAdapterMap(
				new SingleRwLockAdapterMap(new QueueRwLockAdapter()),
			)

		// Assert
		expect(builder).toBeInstanceOf(ConfigBuilder)

		const config = builder.build({
			store,
			storage,
		})

		expect(config).toBeDefined()
	})

	test("static create method showcase", () => {
		// Act
		const builder1 = ConfigBuilder.create<AppConfig>()
		const builder2 = ConfigBuilder.create<{ value: string }>()

		// Assert
		expect(builder1).toBeInstanceOf(ConfigBuilder)
		expect(builder2).toBeInstanceOf(ConfigBuilder)
		expect(builder1).not.toBe(builder2)
	})

	test("default values showcase", async () => {
		// Arrange
		const store = createStore()
		const storage = new InMemoryConfigStorage()

		// Act
		const config = ConfigBuilder.create<AppConfig>()
			.addField("theme", "light", themeSerializer)
			.addField("fontSize", 14, numberSerializer)
			.build({
				store,
				storage,
			})

		// Assert
		expect(await config.getField("theme")).toBe("light")
		expect(await config.getField("fontSize")).toBe(14)
	})

	test("storage key customization showcase", async () => {
		// Arrange
		const store = createStore()
		const storage = new InMemoryConfigStorage()

		// Act
		const config = ConfigBuilder.create<AppConfig>()
			.addField("theme", "light", themeSerializer, "custom_theme_key")
			.addField("fontSize", 14, numberSerializer)
			.build({
				store,
				storage,
			})

		await config.setField("theme", "dark")
		await config.setField("fontSize", 16)

		// Assert
		expect(await config.getField("theme")).toBe("dark")
		expect(await config.getField("fontSize")).toBe(16)
	})
})
