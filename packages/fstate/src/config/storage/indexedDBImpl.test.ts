import "fake-indexeddb/auto"
import { afterEach, beforeEach, describe, expect, test } from "vitest"
import { IndexedDBConfigStorage } from "./indexedDBImpl"

describe("IndexedDBConfigStorage", () => {
	let storage: IndexedDBConfigStorage

	beforeEach(() => {
		// Clear any existing databases
		indexedDB.deleteDatabase("ConfigDB")
		indexedDB.deleteDatabase("TestDB")
		indexedDB.deleteDatabase("CustomDB")
	})

	afterEach(() => {
		storage?.close()
	})

	describe("constructor", () => {
		test("should create instance with default parameters", () => {
			storage = new IndexedDBConfigStorage()
			expect(storage).toBeInstanceOf(IndexedDBConfigStorage)
		})

		test("should create instance with custom parameters", () => {
			storage = new IndexedDBConfigStorage({
				dbName: "CustomDB",
				storeName: "customStore",
				version: 2,
			})
			expect(storage).toBeInstanceOf(IndexedDBConfigStorage)
		})

		test("should create instance with partial custom parameters", () => {
			storage = new IndexedDBConfigStorage({
				dbName: "TestDB",
			})
			expect(storage).toBeInstanceOf(IndexedDBConfigStorage)
		})
	})

	describe("basic operations", () => {
		beforeEach(() => {
			storage = new IndexedDBConfigStorage()
		})

		test("should store and retrieve a string value", async () => {
			const key = "testString"
			const value = "hello world"

			await storage.set(key, value)
			const result = await storage.get(key)

			expect(result).toBe(value)
		})

		test("should store and retrieve a number value", async () => {
			const key = "testNumber"
			const value = 42

			await storage.set(key, value)
			const result = await storage.get(key)

			expect(result).toBe(value)
		})

		test("should store and retrieve a boolean value", async () => {
			const key = "testBoolean"
			const value = true

			await storage.set(key, value)
			const result = await storage.get(key)

			expect(result).toBe(value)
		})

		test("should store and retrieve an object value", async () => {
			const key = "testObject"
			const value = { name: "test", count: 123, active: true }

			await storage.set(key, value)
			const result = await storage.get(key)

			expect(result).toEqual(value)
		})

		test("should store and retrieve an array value", async () => {
			const key = "testArray"
			const value = [1, "two", { three: 3 }, true]

			await storage.set(key, value)
			const result = await storage.get(key)

			expect(result).toEqual(value)
		})

		test("should store and retrieve null value", async () => {
			const key = "testNull"
			const value = null

			await storage.set(key, value)
			const result = await storage.get(key)

			expect(result).toBe(value)
		})

		test("should throw error when trying to store undefined value", async () => {
			const key = "testUndefined"
			const value = undefined

			await expect(storage.set(key, value)).rejects.toThrow(
				"Cannot store undefined values in IndexedDB storage",
			)

			// Key should not exist after failed set
			expect(await storage.has(key)).toBe(false)
			expect(await storage.get(key)).toBeNull()
		})
	})

	describe("get method", () => {
		beforeEach(() => {
			storage = new IndexedDBConfigStorage()
		})

		test("should return null for non-existent key", async () => {
			const result = await storage.get("nonExistentKey")
			expect(result).toBeNull()
		})

		test("should return stored value for existing key", async () => {
			const key = "existingKey"
			const value = "stored value"

			await storage.set(key, value)
			const result = await storage.get(key)

			expect(result).toBe(value)
		})

		test("should handle empty string key", async () => {
			const key = ""
			const value = "empty key value"

			await storage.set(key, value)
			const result = await storage.get(key)

			expect(result).toBe(value)
		})

		test("should handle special characters in key", async () => {
			const key = "special!@#$%^&*()_+-={}[]|\\:;\"'<>,.?/~`"
			const value = "special chars value"

			await storage.set(key, value)
			const result = await storage.get(key)

			expect(result).toBe(value)
		})
	})

	describe("set method", () => {
		beforeEach(() => {
			storage = new IndexedDBConfigStorage()
		})

		test("should overwrite existing value", async () => {
			const key = "overwriteKey"
			const originalValue = "original"
			const newValue = "overwritten"

			await storage.set(key, originalValue)
			const originalResult = await storage.get(key)
			expect(originalResult).toBe(originalValue)

			await storage.set(key, newValue)
			const newResult = await storage.get(key)
			expect(newResult).toBe(newValue)
		})

		test("should handle multiple keys", async () => {
			const data = {
				key1: "value1",
				key2: 42,
				key3: { nested: true },
			}

			for (const [key, value] of Object.entries(data)) {
				await storage.set(key, value)
			}

			for (const [key, expectedValue] of Object.entries(data)) {
				const result = await storage.get(key)
				expect(result).toEqual(expectedValue)
			}
		})

		test("should handle large data objects", async () => {
			const key = "largeData"
			const largeArray = Array.from({ length: 1000 }, (_, i) => ({
				id: i,
				name: `item-${i}`,
				data: `large data content ${i}`.repeat(10),
			}))

			await storage.set(key, largeArray)
			const result = await storage.get(key)

			expect(result).toEqual(largeArray)
		})
	})

	describe("delete method", () => {
		beforeEach(() => {
			storage = new IndexedDBConfigStorage()
		})

		test("should delete existing key", async () => {
			const key = "deleteMe"
			const value = "to be deleted"

			await storage.set(key, value)
			expect(await storage.get(key)).toBe(value)

			await storage.delete(key)
			expect(await storage.get(key)).toBeNull()
		})

		test("should not throw when deleting non-existent key", async () => {
			await expect(
				storage.delete("nonExistentKey"),
			).resolves.toBeUndefined()
		})

		test("should handle multiple deletions", async () => {
			const keys = ["delete1", "delete2", "delete3"]
			const value = "delete value"

			// Set values
			for (const key of keys) {
				await storage.set(key, value)
			}

			// Verify they exist
			for (const key of keys) {
				expect(await storage.get(key)).toBe(value)
			}

			// Delete them
			for (const key of keys) {
				await storage.delete(key)
			}

			// Verify they're gone
			for (const key of keys) {
				expect(await storage.get(key)).toBeNull()
			}
		})
	})

	describe("has method", () => {
		beforeEach(() => {
			storage = new IndexedDBConfigStorage()
		})

		test("should return true for existing key", async () => {
			const key = "existsKey"
			const value = "exists"

			await storage.set(key, value)
			const result = await storage.has(key)

			expect(result).toBe(true)
		})

		test("should return false for non-existent key", async () => {
			const result = await storage.has("nonExistentKey")
			expect(result).toBe(false)
		})

		test("should return false for deleted key", async () => {
			const key = "deletedKey"
			const value = "will be deleted"

			await storage.set(key, value)
			expect(await storage.has(key)).toBe(true)

			await storage.delete(key)
			expect(await storage.has(key)).toBe(false)
		})

		test("should handle null values", async () => {
			const key = "nullKey"
			const value = null

			await storage.set(key, value)

			// Get should return null
			const getResult = await storage.get(key)
			expect(getResult).toBe(null)

			// Has should return true because the key exists, even though the value is null
			const result = await storage.has(key)
			expect(result).toBe(true)
		})

		test("should throw when trying to store undefined values", async () => {
			const key = "undefinedKey"
			const value = undefined

			await expect(storage.set(key, value)).rejects.toThrow(
				"Cannot store undefined values in IndexedDB storage",
			)

			// Key should not exist
			const result = await storage.has(key)
			expect(result).toBe(false)
		})
	})

	describe("database initialization", () => {
		test("should work with custom database configuration", async () => {
			storage = new IndexedDBConfigStorage({
				dbName: "CustomTestDB",
				storeName: "customStore",
				version: 3,
			})

			const key = "customTest"
			const value = "custom database test"

			await storage.set(key, value)
			const result = await storage.get(key)

			expect(result).toBe(value)
		})

		test("should reuse existing database connection", async () => {
			storage = new IndexedDBConfigStorage({ dbName: "ReuseTestDB" })

			// First operation should initialize the database
			await storage.set("key1", "value1")
			const result1 = await storage.get("key1")
			expect(result1).toBe("value1")

			// Second operation should reuse the connection
			await storage.set("key2", "value2")
			const result2 = await storage.get("key2")
			expect(result2).toBe("value2")

			// Both values should still be accessible
			expect(await storage.get("key1")).toBe("value1")
			expect(await storage.get("key2")).toBe("value2")
		})
	})

	describe("close method", () => {
		test("should close database connection", async () => {
			storage = new IndexedDBConfigStorage()

			// Initialize database by performing an operation
			await storage.set("testKey", "testValue")
			expect(await storage.get("testKey")).toBe("testValue")

			// Close the connection
			storage.close()

			// Should still work after close (will reinitialize)
			await storage.set("afterClose", "afterCloseValue")
			expect(await storage.get("afterClose")).toBe("afterCloseValue")
		})

		test("should handle multiple close calls", () => {
			storage = new IndexedDBConfigStorage()

			expect(() => {
				storage.close()
				storage.close()
				storage.close()
			}).not.toThrow()
		})

		test("should handle close before initialization", () => {
			storage = new IndexedDBConfigStorage()

			expect(() => {
				storage.close()
			}).not.toThrow()
		})
	})

	describe("edge cases and error scenarios", () => {
		beforeEach(() => {
			storage = new IndexedDBConfigStorage()
		})

		test("should handle concurrent operations", async () => {
			const operations: Promise<void>[] = []
			const numOperations = 50

			// Create multiple concurrent set operations
			for (let i = 0; i < numOperations; i++) {
				operations.push(storage.set(`concurrent-${i}`, `value-${i}`))
			}

			// Wait for all operations to complete
			await Promise.all(operations)

			// Verify all values were set correctly
			const getOperations: Promise<unknown>[] = []
			for (let i = 0; i < numOperations; i++) {
				getOperations.push(storage.get(`concurrent-${i}`))
			}

			const results = await Promise.all(getOperations)

			for (let i = 0; i < numOperations; i++) {
				expect(results[i]).toBe(`value-${i}`)
			}
		})

		test("should handle very long keys", async () => {
			const longKey = "a".repeat(1000)
			const value = "long key value"

			await storage.set(longKey, value)
			const result = await storage.get(longKey)

			expect(result).toBe(value)
		})

		test("should handle operations after close and reoperation", async () => {
			const key = "persistentKey"
			const value = "persistent value"

			// Set a value
			await storage.set(key, value)
			expect(await storage.get(key)).toBe(value)

			// Close the connection
			storage.close()

			// Perform operations after close (should reinitialize)
			await storage.set("newKey", "newValue")
			expect(await storage.get("newKey")).toBe("newValue")

			// Original value should still be there
			expect(await storage.get(key)).toBe(value)
		})

		test("should handle mixed data types in same storage", async () => {
			const testData = [
				{ key: "string", value: "test string" },
				{ key: "number", value: 42 },
				{ key: "boolean", value: true },
				{ key: "null", value: null },
				{ key: "object", value: { nested: { deep: "value" } } },
				{ key: "array", value: [1, "two", { three: 3 }] },
				{ key: "date", value: new Date("2023-01-01") },
			]

			// Set all values
			for (const item of testData) {
				await storage.set(item.key, item.value)
			}

			// Retrieve and verify all values
			for (const item of testData) {
				const result = await storage.get(item.key)
				expect(result).toEqual(item.value)
			}

			// Test that undefined throws an error
			await expect(storage.set("undefined", undefined)).rejects.toThrow(
				"Cannot store undefined values in IndexedDB storage",
			)
		})
	})

	describe("integration scenarios", () => {
		beforeEach(() => {
			storage = new IndexedDBConfigStorage()
		})

		test("should maintain data integrity across multiple operations", async () => {
			const testKey = "integrityTest"

			// Initial set
			await storage.set(testKey, "initial")
			expect(await storage.get(testKey)).toBe("initial")
			expect(await storage.has(testKey)).toBe(true)

			// Update
			await storage.set(testKey, "updated")
			expect(await storage.get(testKey)).toBe("updated")
			expect(await storage.has(testKey)).toBe(true)

			// Delete
			await storage.delete(testKey)
			expect(await storage.get(testKey)).toBeNull()
			expect(await storage.has(testKey)).toBe(false)

			// Set again
			await storage.set(testKey, "final")
			expect(await storage.get(testKey)).toBe("final")
			expect(await storage.has(testKey)).toBe(true)
		})

		test("should handle storage lifecycle", async () => {
			// Create storage instance
			const tempStorage = new IndexedDBConfigStorage({
				dbName: "LifecycleTestDB",
			})

			try {
				// Use storage
				await tempStorage.set("lifecycle", "test")
				expect(await tempStorage.get("lifecycle")).toBe("test")

				// Close storage
				tempStorage.close()

				// Use again (should reinitialize)
				await tempStorage.set("lifecycle2", "test2")
				expect(await tempStorage.get("lifecycle2")).toBe("test2")
				expect(await tempStorage.get("lifecycle")).toBe("test")
			} finally {
				tempStorage.close()
			}
		})
	})

	describe("error handling", () => {
		test("should handle database initialization errors gracefully", async () => {
			// Mock indexedDB to be undefined to simulate unsupported environment
			const originalIndexedDB = globalThis.indexedDB

			try {
				// @ts-expect-error - intentionally setting undefined for testing
				globalThis.indexedDB = undefined

				storage = new IndexedDBConfigStorage()

				await expect(storage.get("test")).rejects.toThrow(
					"IndexedDB is not available",
				)
				await expect(storage.set("test", "value")).rejects.toThrow(
					"IndexedDB is not available",
				)
				await expect(storage.delete("test")).rejects.toThrow(
					"IndexedDB is not available",
				)
				await expect(storage.has("test")).rejects.toThrow(
					"IndexedDB is not available",
				)
			} finally {
				globalThis.indexedDB = originalIndexedDB
			}
		})

		test("should throw when attempting to store undefined values", async () => {
			storage = new IndexedDBConfigStorage()

			await expect(storage.set("test", undefined)).rejects.toThrow(
				"Cannot store undefined values in IndexedDB storage",
			)

			// Verify the key was not created
			expect(await storage.has("test")).toBe(false)
			expect(await storage.get("test")).toBeNull()
		})

		test("should handle transaction errors gracefully", async () => {
			storage = new IndexedDBConfigStorage()

			// Initialize the database first
			await storage.set("test", "value")

			// Close the database to potentially cause transaction errors
			storage.close()

			// Operations should still work by reinitializing the database
			await expect(storage.get("test")).resolves.toBe("value")
		})
	})

	describe("real-world usage patterns", () => {
		beforeEach(() => {
			storage = new IndexedDBConfigStorage()
		})

		test("should handle rapid successive operations", async () => {
			const operations: Promise<void>[] = []

			// Rapid set operations
			for (let i = 0; i < 10; i++) {
				operations.push(storage.set(`rapid-${i}`, `value-${i}`))
			}

			await Promise.all(operations)

			// Rapid get operations
			const getOperations: Promise<unknown>[] = []
			for (let i = 0; i < 10; i++) {
				getOperations.push(storage.get(`rapid-${i}`))
			}

			const results = await Promise.all(getOperations)

			for (let i = 0; i < 10; i++) {
				expect(results[i]).toBe(`value-${i}`)
			}
		})

		test("should handle complex nested objects", async () => {
			const complexObject = {
				user: {
					id: 123,
					name: "John Doe",
					preferences: {
						theme: "dark",
						notifications: {
							email: true,
							push: false,
							sms: null,
						},
					},
					tags: ["admin", "beta-tester"],
					metadata: {
						createdAt: new Date("2023-01-01"),
						lastLogin: null,
					},
				},
				config: {
					features: ["feature1", "feature2"],
					limits: {
						storage: 1000000,
						requests: 10000,
					},
				},
			}

			await storage.set("complex", complexObject)
			const result = await storage.get("complex")

			expect(result).toEqual(complexObject)
		})

		test("should maintain performance with large datasets", async () => {
			const largeDataset = Array.from({ length: 100 }, (_, i) => ({
				id: i,
				name: `User ${i}`,
				data: Array.from({ length: 50 }, (_, j) => ({
					field: `field-${j}`,
					value: `value-${i}-${j}`,
				})),
			}))

			const startTime = Date.now()
			await storage.set("largeDataset", largeDataset)
			const setTime = Date.now() - startTime

			const getStartTime = Date.now()
			const result = await storage.get("largeDataset")
			const getTime = Date.now() - getStartTime

			expect(result).toEqual(largeDataset)
			expect(setTime).toBeLessThan(1000) // Should complete within 1 second
			expect(getTime).toBeLessThan(500) // Should complete within 0.5 seconds
		})

		test("should handle storage of different data types in sequence", async () => {
			const testSequence = [
				{ key: "string", value: "test" },
				{ key: "number", value: 42 },
				{ key: "boolean", value: true },
				{ key: "array", value: [1, 2, 3] },
				{ key: "object", value: { nested: "value" } },
				{ key: "null", value: null },
			]

			// Store sequentially
			for (const item of testSequence) {
				await storage.set(item.key, item.value)
			}

			// Retrieve and verify sequentially
			for (const item of testSequence) {
				const result = await storage.get(item.key)
				expect(result).toEqual(item.value)
				expect(await storage.has(item.key)).toBe(true)
			}
		})
	})

	describe("database lifecycle management", () => {
		test("should handle multiple storage instances with different configurations", async () => {
			const storage1 = new IndexedDBConfigStorage({
				dbName: "DB1",
				storeName: "store1",
			})
			const storage2 = new IndexedDBConfigStorage({
				dbName: "DB2",
				storeName: "store2",
			})

			try {
				await storage1.set("key", "value1")
				await storage2.set("key", "value2")

				expect(await storage1.get("key")).toBe("value1")
				expect(await storage2.get("key")).toBe("value2")

				// They should be independent
				await storage1.delete("key")
				expect(await storage1.has("key")).toBe(false)
				expect(await storage2.has("key")).toBe(true)
			} finally {
				storage1.close()
				storage2.close()
			}
		})

		test("should handle database version upgrades", async () => {
			// Create with version 1
			const storageV1 = new IndexedDBConfigStorage({
				dbName: "VersionTestDB",
				version: 1,
			})

			await storageV1.set("test", "version1")
			expect(await storageV1.get("test")).toBe("version1")
			storageV1.close()

			// Create with version 2 (should trigger upgrade)
			const storageV2 = new IndexedDBConfigStorage({
				dbName: "VersionTestDB",
				version: 2,
			})

			// Data should still be there after upgrade
			expect(await storageV2.get("test")).toBe("version1")
			await storageV2.set("test", "version2")
			expect(await storageV2.get("test")).toBe("version2")

			storageV2.close()
		})
	})
})
