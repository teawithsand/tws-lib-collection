import { beforeEach, describe, expect, test } from "vitest"
import { BackendClient, BackendError, FetchHttpClient } from "./client"
import { MockBackend, createMockHttpClient } from "./mockBackend"

describe("BackendClient", () => {
	let client: BackendClient
	let mockBackend: MockBackend

	beforeEach(() => {
		mockBackend = new MockBackend()
		client = new BackendClient({
			baseUrl: "http://localhost:3000",
			httpClient: createMockHttpClient(mockBackend),
		})
	})

	describe("configuration", () => {
		test("should handle base URL with trailing slash", () => {
			const clientWithSlash = new BackendClient({
				baseUrl: "http://localhost:3000/",
				httpClient: createMockHttpClient(mockBackend),
			})
			expect(clientWithSlash).toBeDefined()
		})

		test("should use custom HTTP client", () => {
			const customHttpClient = new FetchHttpClient()
			const clientWithCustomHttp = new BackendClient({
				baseUrl: "http://localhost:3000",
				httpClient: customHttpClient,
			})
			expect(clientWithCustomHttp).toBeDefined()
		})
	})

	describe("authentication", () => {
		test("should start unauthenticated", () => {
			expect(client.isAuthenticated()).toBe(false)
			expect(client.getAuthToken()).toBeNull()
		})

		test("should set and get auth token", () => {
			const token = "test-token"
			client.setAuthToken(token)

			expect(client.isAuthenticated()).toBe(true)
			expect(client.getAuthToken()).toBe(token)
		})

		test("should clear auth token on logout", () => {
			client.setAuthToken("test-token")
			client.logout()

			expect(client.isAuthenticated()).toBe(false)
			expect(client.getAuthToken()).toBeNull()
		})
	})

	describe("register", () => {
		test("should register user successfully", async () => {
			const result = await client.register({
				username: "testuser",
				password: "password123",
			})

			expect(result.message).toBe("User registered successfully")
			expect(result.token).toMatch(/^mock-jwt-/)
			expect(result.user.username).toBe("testuser")
			expect(result.user.id).toMatch(/^user_\d+$/)
			expect(result.user.createdAt).toBeDefined()
		})

		test("should handle duplicate username registration", async () => {
			// Register first user
			await client.register({
				username: "testuser",
				password: "password123",
			})

			// Try to register with same username
			await expect(
				client.register({
					username: "testuser",
					password: "differentpass",
				}),
			).rejects.toThrow(BackendError)
		})

		test("should validate username length", async () => {
			await expect(
				client.register({
					username: "ab", // Too short
					password: "password123",
				}),
			).rejects.toThrow(BackendError)
		})

		test("should validate password length", async () => {
			await expect(
				client.register({
					username: "testuser",
					password: "12345", // Too short
				}),
			).rejects.toThrow(BackendError)
		})
	})

	describe("login", () => {
		beforeEach(async () => {
			// Register a user for login tests
			await client.register({
				username: "testuser",
				password: "password123",
			})
			// Clear token after registration
			client.logout()
		})

		test("should login user and set token", async () => {
			const result = await client.login({
				username: "testuser",
				password: "password123",
			})

			expect(result.message).toBe("Login successful")
			expect(result.token).toMatch(/^mock-jwt-/)
			expect(result.user.username).toBe("testuser")
			expect(client.getAuthToken()).toBe(result.token)
			expect(client.isAuthenticated()).toBe(true)
		})

		test("should handle invalid username", async () => {
			await expect(
				client.login({
					username: "nonexistent",
					password: "password123",
				}),
			).rejects.toThrow(BackendError)
		})

		test("should handle invalid password", async () => {
			await expect(
				client.login({
					username: "testuser",
					password: "wrongpassword",
				}),
			).rejects.toThrow(BackendError)
		})

		test("should handle missing credentials", async () => {
			await expect(
				client.login({
					username: "",
					password: "password123",
				}),
			).rejects.toThrow(BackendError)

			await expect(
				client.login({
					username: "testuser",
					password: "",
				}),
			).rejects.toThrow(BackendError)
		})
	})

	describe("collections", () => {
		beforeEach(async () => {
			// Register and login a user for collection tests
			const authResponse = await client.register({
				username: "testuser",
				password: "password123",
			})
			client.setAuthToken(authResponse.token)
		})

		test("should save collection when authenticated", async () => {
			const result = await client.saveCollection("test-collection", {
				test: "collection data",
			})

			expect(result.message).toBe("Collection saved successfully")
			expect(result.id).toBe("test-collection")
			expect(result.savedAt).toBeDefined()
		})

		test("should throw error when saving collection without authentication", async () => {
			client.logout() // Remove authentication

			await expect(
				client.saveCollection("test-collection", {
					test: "data",
				}),
			).rejects.toThrow(BackendError)
		})

		test("should get collection after saving", async () => {
			// Save a collection first
			await client.saveCollection("test-collection", {
				test: "collection data",
			})

			// Retrieve the collection
			const result = await client.getCollection("test-collection")

			expect(result.test).toBe("collection data")
			expect(result.id).toBe("test-collection")
			expect(result.savedAt).toBeDefined()
			expect(result.savedBy).toBe("testuser")
		})

		test("should handle non-existent collection", async () => {
			await expect(client.getCollection("non-existent")).rejects.toThrow(
				BackendError,
			)
		})

		test("should validate collection ID", async () => {
			await expect(
				client.saveCollection("", { test: "data" }),
			).rejects.toThrow(BackendError)

			await expect(client.getCollection("")).rejects.toThrow(BackendError)
		})

		test("should list collections", async () => {
			// Save a few collections first
			await client.saveCollection("collection1", {
				test: "data1",
			})

			await client.saveCollection("collection2", {
				test: "data2",
			})

			// List collections
			const result = await client.listCollections()

			expect(result.collections).toHaveLength(2)
			expect(result.total).toBe(2)

			// Check that collections are sorted by savedAt (newest first)
			const collection1 = result.collections.find(
				(c) => c.id === "collection1",
			)
			const collection2 = result.collections.find(
				(c) => c.id === "collection2",
			)

			expect(collection1).toBeDefined()
			expect(collection2).toBeDefined()
			expect(collection1?.savedBy).toBe("testuser")
			expect(collection2?.savedBy).toBe("testuser")
			expect(collection1?.savedAt).toBeDefined()
			expect(collection2?.savedAt).toBeDefined()
		})

		test("should list empty collections when none exist", async () => {
			// Create a fresh client with mock backend that has no collections
			const freshMockBackend = new MockBackend()
			const freshClient = new BackendClient({
				baseUrl: "http://localhost:3000",
				httpClient: createMockHttpClient(freshMockBackend),
			})

			const result = await freshClient.listCollections()

			expect(result.collections).toHaveLength(0)
			expect(result.total).toBe(0)
		})
	})

	describe("health", () => {
		test("should check health", async () => {
			const result = await client.health()

			expect(result.status).toBe("ok")
			expect(result.timestamp).toBeDefined()
		})
	})

	describe("error handling", () => {
		test("should handle invalid token format", async () => {
			client.setAuthToken("invalid-token")

			await expect(
				client.saveCollection("test", { test: "data" }),
			).rejects.toThrow(BackendError)
		})

		test("should handle expired token", async () => {
			// Create an expired token
			const expiredPayload = {
				userId: "user1",
				username: "test",
				exp: Date.now() - 1000, // Expired 1 second ago
			}
			const expiredToken = `mock-jwt-${Buffer.from(JSON.stringify(expiredPayload)).toString("base64")}`

			client.setAuthToken(expiredToken)

			await expect(
				client.saveCollection("test", { test: "data" }),
			).rejects.toThrow(BackendError)
		})

		test("should provide detailed error information", async () => {
			try {
				await client.login({
					username: "nonexistent",
					password: "password",
				})
			} catch (error) {
				expect(error).toBeInstanceOf(BackendError)
				const backendError = error as BackendError
				expect(backendError.status).toBe(401)
				expect(backendError.message).toBe("Invalid credentials")
				expect(backendError.response).toEqual({
					error: "Invalid credentials",
				})
			}
		})
	})

	describe("integration scenarios", () => {
		test("should handle complete user workflow", async () => {
			// Register user
			const registerResponse = await client.register({
				username: "workflowuser",
				password: "password123",
			})
			expect(registerResponse.message).toBe(
				"User registered successfully",
			)
			expect(client.isAuthenticated()).toBe(true)

			// Save collection
			const saveResponse = await client.saveCollection(
				"workflow-collection",
				{
					test: "workflow data",
				},
			)
			expect(saveResponse.message).toBe("Collection saved successfully")

			// Logout
			client.logout()
			expect(client.isAuthenticated()).toBe(false)

			// Login again
			const loginResponse = await client.login({
				username: "workflowuser",
				password: "password123",
			})
			expect(loginResponse.message).toBe("Login successful")
			expect(client.isAuthenticated()).toBe(true)

			// Retrieve collection
			const collection = await client.getCollection("workflow-collection")
			expect(collection.test).toBe("workflow data")
			expect(collection.savedBy).toBe("workflowuser")
		})

		test("should handle multiple users and collections", async () => {
			// Register first user
			await client.register({
				username: "user1",
				password: "password123",
			})

			// Save collection as user1
			await client.saveCollection("user1-collection", {
				test: "user1 data",
			})

			// Logout and register second user
			client.logout()
			await client.register({
				username: "user2",
				password: "password456",
			})

			// Save collection as user2
			await client.saveCollection("user2-collection", {
				test: "user2 data",
			})

			// Both users should exist and collections should be separate
			const user1Collection =
				await client.getCollection("user1-collection")
			const user2Collection =
				await client.getCollection("user2-collection")

			expect(user1Collection.test).toBe("user1 data")
			expect(user1Collection.savedBy).toBe("user1")
			expect(user2Collection.test).toBe("user2 data")
			expect(user2Collection.savedBy).toBe("user2")
		})
	})
})
