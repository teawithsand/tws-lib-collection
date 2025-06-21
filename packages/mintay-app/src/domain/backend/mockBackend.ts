import { BackendCollectionData } from "./backendCollectionData"

/**
 * Mock user data store
 */
interface MockUser {
	readonly id: string
	readonly username: string
	readonly passwordHash: string
	readonly createdAt: string
}

/**
 * Mock collection data store
 */
interface MockCollection extends BackendCollectionData {
	readonly id: string
	readonly savedAt: string
	readonly savedBy?: string
}

/**
 * Mock backend implementation for testing
 */
export class MockBackend {
	private users: MockUser[] = []
	private collections: Map<string, MockCollection> = new Map()
	private nextUserId = 1

	/**
	 * Reset all mock data
	 */
	public readonly reset = (): void => {
		this.users = []
		this.collections.clear()
		this.nextUserId = 1
	}

	/**
	 * Mock user registration
	 */
	public readonly register = (username: string, password: string) => {
		// Check if username exists
		if (this.users.some((user) => user.username === username)) {
			return {
				status: 409,
				response: { error: "Username already exists" },
			}
		}

		// Validate input
		if (!username || username.length < 3) {
			return {
				status: 400,
				response: {
					error: "Username must be at least 3 characters long",
				},
			}
		}

		if (!password || password.length < 6) {
			return {
				status: 400,
				response: {
					error: "Password must be at least 6 characters long",
				},
			}
		}

		// Create user
		const user: MockUser = {
			id: `user_${this.nextUserId++}`,
			username,
			passwordHash: this.hashPassword(password),
			createdAt: new Date().toISOString(),
		}

		this.users.push(user)

		// Generate token
		const token = this.generateToken(user.id, user.username)

		return {
			status: 201,
			response: {
				message: "User registered successfully",
				token,
				user: {
					id: user.id,
					username: user.username,
					createdAt: user.createdAt,
				},
			},
		}
	}

	/**
	 * Mock user login
	 */
	public readonly login = (username: string, password: string) => {
		// Validate input
		if (!username || !password) {
			return {
				status: 400,
				response: { error: "Username and password are required" },
			}
		}

		// Find user
		const user = this.users.find((u) => u.username === username)
		if (!user) {
			return {
				status: 401,
				response: { error: "Invalid credentials" },
			}
		}

		// Verify password
		if (!this.verifyPassword(password, user.passwordHash)) {
			return {
				status: 401,
				response: { error: "Invalid credentials" },
			}
		}

		// Generate token
		const token = this.generateToken(user.id, user.username)

		return {
			status: 200,
			response: {
				message: "Login successful",
				token,
				user: {
					id: user.id,
					username: user.username,
					createdAt: user.createdAt,
				},
			},
		}
	}

	/**
	 * Mock collection save
	 */
	public readonly saveCollection = (
		collectionId: string,
		data: BackendCollectionData,
		token?: string,
	) => {
		// Validate token
		if (!token) {
			return {
				status: 401,
				response: { error: "Access token required" },
			}
		}

		const userData = this.verifyToken(token)
		if (!userData) {
			return {
				status: 401,
				response: { error: "Invalid or expired token" },
			}
		}

		// Validate input
		if (!collectionId) {
			return {
				status: 400,
				response: { error: "Collection ID is required" },
			}
		}

		if (!data || typeof data !== "object") {
			return {
				status: 400,
				response: { error: "Valid collection data is required" },
			}
		}

		// Save collection
		const collection: MockCollection = {
			...data,
			id: collectionId,
			savedAt: new Date().toISOString(),
			savedBy: userData.username,
		}

		this.collections.set(collectionId, collection)

		return {
			status: 200,
			response: {
				message: "Collection saved successfully",
				id: collectionId,
				savedAt: collection.savedAt,
			},
		}
	}

	/**
	 * Mock collection get
	 */
	public readonly getCollection = (collectionId: string) => {
		if (!collectionId) {
			return {
				status: 400,
				response: { error: "Collection ID is required" },
			}
		}

		const collection = this.collections.get(collectionId)
		if (!collection) {
			return {
				status: 404,
				response: { error: "Collection not found" },
			}
		}

		return {
			status: 200,
			response: collection,
		}
	}

	/**
	 * Mock list all collections
	 */
	public readonly listCollections = () => {
		const collections = Array.from(this.collections.values()).map(
			(collection) => ({
				id: collection.id,
				savedAt: collection.savedAt,
				savedBy: collection.savedBy,
			}),
		)

		// Sort by savedAt date, newest first
		collections.sort((a, b) => {
			return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
		})

		return {
			status: 200,
			response: {
				collections,
				total: collections.length,
			},
		}
	}

	/**
	 * Mock health check
	 */
	public readonly health = () => {
		return {
			status: 200,
			response: {
				status: "ok",
				timestamp: new Date().toISOString(),
			},
		}
	}

	/**
	 * Simple password hashing (same as backend)
	 */
	private readonly hashPassword = (password: string): string => {
		return Buffer.from(password + "salt").toString("base64")
	}

	/**
	 * Simple password verification
	 */
	private readonly verifyPassword = (
		password: string,
		hash: string,
	): boolean => {
		return this.hashPassword(password) === hash
	}

	/**
	 * Generate a mock JWT token
	 */
	private readonly generateToken = (
		userId: string,
		username: string,
	): string => {
		const payload = {
			userId,
			username,
			exp: Date.now() + 24 * 60 * 60 * 1000,
		}
		return `mock-jwt-${Buffer.from(JSON.stringify(payload)).toString("base64")}`
	}

	/**
	 * Verify a mock JWT token
	 */
	private readonly verifyToken = (
		token: string,
	): { userId: string; username: string } | null => {
		if (!token.startsWith("mock-jwt-")) {
			return null
		}

		try {
			const payload = JSON.parse(
				Buffer.from(token.substring(9), "base64").toString(),
			)
			if (payload.exp < Date.now()) {
				return null
			}
			return { userId: payload.userId, username: payload.username }
		} catch {
			return null
		}
	}
}

/**
 * Create a mock HTTP client that uses the mock backend
 */
export const createMockHttpClient = (mockBackend: MockBackend) => {
	return {
		request: async (
			url: string,
			options: RequestInit = {},
		): Promise<Response> => {
			const method = options.method || "GET"
			const headers = (options.headers as Record<string, string>) || {}
			const body = options.body
				? JSON.parse(options.body as string)
				: undefined

			// Extract auth token
			const authHeader = headers.Authorization || headers.authorization
			const token = authHeader?.startsWith("Bearer ")
				? authHeader.substring(7)
				: undefined

			// Route the request
			let result: { status: number; response: unknown }

			if (url.endsWith("/health")) {
				result = mockBackend.health()
			} else if (
				url.endsWith("/api/auth/register") &&
				method === "POST"
			) {
				result = mockBackend.register(body.username, body.password)
			} else if (url.endsWith("/api/auth/login") && method === "POST") {
				result = mockBackend.login(body.username, body.password)
			} else if (url.endsWith("/api/collections") && method === "GET") {
				// List all collections
				result = mockBackend.listCollections()
			} else if (url.includes("/api/collections/") && method === "PUT") {
				const collectionId = url.split("/api/collections/")[1]
				result = mockBackend.saveCollection(collectionId, body, token)
			} else if (url.includes("/api/collections/") && method === "GET") {
				const collectionId = url.split("/api/collections/")[1]
				result = mockBackend.getCollection(collectionId)
			} else {
				result = { status: 404, response: { error: "Not found" } }
			}

			// Create mock Response object
			return {
				ok: result.status >= 200 && result.status < 300,
				status: result.status,
				statusText: result.status === 200 ? "OK" : "Error",
				json: async () => result.response,
			} as Response
		},
	}
}
