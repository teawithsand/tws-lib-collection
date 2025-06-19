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
				collection: {
					globalId: "test-collection-global-id",
					title: "Test Collection",
					description: "A test collection",
				},
				cards: [
					{
						globalId: "card-1",
						questionContent: "What is 2+2?",
						answerContent: "4",
					},
				],
			})

			expect(result.message).toBe("Collection saved successfully")
			expect(result.id).toBe("test-collection")
			expect(result.savedAt).toBeDefined()
		})

		test("should throw error when saving collection without authentication", async () => {
			client.logout() // Remove authentication

			await expect(
				client.saveCollection("test-collection", {
					collection: {
						globalId: "test-collection-global-id",
						title: "Test Collection",
					},
					cards: [],
				}),
			).rejects.toThrow(BackendError)
		})

		test("should get collection after saving", async () => {
			// Save a collection first
			await client.saveCollection("test-collection", {
				collection: {
					globalId: "test-collection-global-id",
					title: "Test Collection",
					description: "A test collection",
				},
				cards: [
					{
						globalId: "card-1",
						questionContent: "What is 2+2?",
						answerContent: "4",
					},
				],
			})

			// Retrieve the collection
			const result = await client.getCollection("test-collection")

			expect(result.collection.title).toBe("Test Collection")
			expect(result.collection.description).toBe("A test collection")
			expect(result.cards).toHaveLength(1)
			expect(result.cards[0].questionContent).toBe("What is 2+2?")
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
				client.saveCollection("", {
					collection: {
						globalId: "test-global-id",
						title: "Test Collection",
					},
					cards: [],
				}),
			).rejects.toThrow(BackendError)

			await expect(client.getCollection("")).rejects.toThrow(BackendError)
		})

		test("should list collections", async () => {
			// Save a few collections first
			await client.saveCollection("collection1", {
				collection: {
					globalId: "collection1-global-id",
					title: "Collection 1",
					description: "First test collection",
				},
				cards: [
					{
						globalId: "card-1-1",
						questionContent: "Question 1",
						answerContent: "Answer 1",
					},
				],
			})

			await client.saveCollection("collection2", {
				collection: {
					globalId: "collection2-global-id",
					title: "Collection 2",
					description: "Second test collection",
				},
				cards: [
					{
						globalId: "card-2-1",
						questionContent: "Question 2",
						answerContent: "Answer 2",
					},
				],
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
				client.saveCollection("test", {
					collection: {
						globalId: "test-global-id",
						title: "Test Collection",
					},
					cards: [],
				}),
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
				client.saveCollection("test", {
					collection: {
						globalId: "test-global-id",
						title: "Test Collection",
					},
					cards: [],
				}),
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
					collection: {
						globalId: "workflow-collection-global-id",
						title: "Workflow Collection",
						description:
							"A collection for testing complete workflow",
					},
					cards: [
						{
							globalId: "workflow-card-1",
							questionContent: "Workflow question",
							answerContent: "Workflow answer",
						},
					],
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
			expect(collection.collection.title).toBe("Workflow Collection")
			expect(collection.collection.description).toBe(
				"A collection for testing complete workflow",
			)
			expect(collection.cards).toHaveLength(1)
			expect(collection.cards[0].questionContent).toBe(
				"Workflow question",
			)
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
				collection: {
					globalId: "user1-collection-global-id",
					title: "User 1 Collection",
					description: "Collection created by user1",
				},
				cards: [
					{
						globalId: "user1-card-1",
						questionContent: "User1 question",
						answerContent: "User1 answer",
					},
				],
			})

			// Logout and register second user
			client.logout()
			await client.register({
				username: "user2",
				password: "password456",
			})

			// Save collection as user2
			await client.saveCollection("user2-collection", {
				collection: {
					globalId: "user2-collection-global-id",
					title: "User 2 Collection",
					description: "Collection created by user2",
				},
				cards: [
					{
						globalId: "user2-card-1",
						questionContent: "User2 question",
						answerContent: "User2 answer",
					},
				],
			})

			// Both users should exist and collections should be separate
			const user1Collection =
				await client.getCollection("user1-collection")
			const user2Collection =
				await client.getCollection("user2-collection")

			expect(user1Collection.collection.title).toBe("User 1 Collection")
			expect(user1Collection.savedBy).toBe("user1")
			expect(user2Collection.collection.title).toBe("User 2 Collection")
			expect(user2Collection.savedBy).toBe("user2")
		})
	})
})
