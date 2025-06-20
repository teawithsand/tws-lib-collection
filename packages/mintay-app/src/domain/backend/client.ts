import { z } from "zod"
import {
	BackendCollectionData,
	backendCollectionDataSchema,
} from "./backendCollectionData"

/**
 * HTTP client abstraction to allow replacing fetch in the future
 */
export interface HttpClient {
	readonly request: (url: string, options?: RequestInit) => Promise<Response>
}

/**
 * Default fetch-based HTTP client implementation
 */
export class FetchHttpClient implements HttpClient {
	public readonly request = async (
		url: string,
		options?: RequestInit,
	): Promise<Response> => {
		return fetch(url, options)
	}
}

/**
 * User registration data
 */
export interface UserRegistrationData {
	readonly username: string
	readonly password: string
}

/**
 * User login data
 */
export interface UserLoginData {
	readonly username: string
	readonly password: string
}

/**
 * User data returned from backend
 */
const userSchema = z.object({
	id: z.string(),
	username: z.string(),
	createdAt: z.string(),
})

/**
 * Authentication response schema
 */
const authResponseSchema = z.object({
	message: z.string(),
	token: z.string(),
	user: userSchema,
})

/**
 * Collection save response schema
 */
const collectionSaveResponseSchema = z.object({
	message: z.string(),
	id: z.string(),
	savedAt: z.string(),
})

/**
 * Error response schema
 */
const errorResponseSchema = z.object({
	error: z.string(),
})

/**
 * Health check response schema
 */
const healthResponseSchema = z.object({
	status: z.string(),
	timestamp: z.string(),
})

export type User = z.infer<typeof userSchema>
export type AuthResponse = z.infer<typeof authResponseSchema>
export type CollectionSaveResponse = z.infer<
	typeof collectionSaveResponseSchema
>
export type ErrorResponse = z.infer<typeof errorResponseSchema>
export type HealthResponse = z.infer<typeof healthResponseSchema>

/**
 * Configuration for the backend client
 */
export interface BackendClientConfig {
	readonly baseUrl: string
	readonly httpClient?: HttpClient
}

/**
 * Custom error class for backend API errors
 */
export class BackendError extends Error {
	constructor(
		message: string,
		public readonly status: number,
		public readonly response?: ErrorResponse,
	) {
		super(message)
		this.name = "BackendError"
	}
}

/**
 * Client for communicating with the Mintay backend API
 */
export class BackendClient {
	private readonly baseUrl: string
	private readonly httpClient: HttpClient
	private authToken: string | null = null

	constructor({
		baseUrl,
		httpClient = new FetchHttpClient(),
	}: BackendClientConfig) {
		this.baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl
		this.httpClient = httpClient
	}

	/**
	 * Set the authentication token for subsequent requests
	 */
	public readonly setAuthToken = (token: string | null): void => {
		this.authToken = token
	}

	/**
	 * Get the current authentication token
	 */
	public readonly getAuthToken = (): string | null => {
		return this.authToken
	}

	/**
	 * Check if the client is authenticated
	 */
	public readonly isAuthenticated = (): boolean => {
		return this.authToken !== null
	}

	/**
	 * Register a new user
	 */
	public readonly register = async (
		userData: UserRegistrationData,
	): Promise<AuthResponse> => {
		const response = await this.makeRequest("/api/auth/register", {
			method: "POST",
			body: JSON.stringify(userData),
		})

		const authResponse = await this.validateResponse(
			response,
			authResponseSchema,
		)
		this.setAuthToken(authResponse.token)
		return authResponse
	}

	/**
	 * Login a user
	 */
	public readonly login = async (
		loginData: UserLoginData,
	): Promise<AuthResponse> => {
		const response = await this.makeRequest("/api/auth/login", {
			method: "POST",
			body: JSON.stringify(loginData),
		})

		const authResponse = await this.validateResponse(
			response,
			authResponseSchema,
		)
		this.setAuthToken(authResponse.token)
		return authResponse
	}

	/**
	 * Logout the current user (clears token)
	 */
	public readonly logout = (): void => {
		this.setAuthToken(null)
	}

	/**
	 * Save a collection to the backend (requires authentication)
	 */
	public readonly saveCollection = async (
		data: BackendCollectionData,
	): Promise<CollectionSaveResponse> => {
		this.ensureAuthenticated()

		const response = await this.makeRequest(
			`/api/collections/${encodeURIComponent(data.collection.globalId)}`,
			{
				method: "PUT",
				body: JSON.stringify(data),
				headers: {
					Authorization: `Bearer ${this.authToken}`,
				},
			},
		)

		return this.validateResponse(response, collectionSaveResponseSchema)
	}

	/**
	 * Get a collection from the backend
	 */
	public readonly getCollection = async (
		collectionId: string,
	): Promise<BackendCollectionData> => {
		const response = await this.makeRequest(
			`/api/collections/${encodeURIComponent(collectionId)}`,
			{
				method: "GET",
			},
		)

		return this.validateResponse(response, backendCollectionDataSchema)
	}

	/**
	 * List all collections from the backend
	 */
	public readonly listCollections = async (): Promise<
		BackendCollectionData[]
	> => {
		const response = await this.makeRequest("/api/collections", {
			method: "GET",
		})

		const listResponse = await this.validateResponse(
			response,
			z.array(backendCollectionDataSchema),
		)

		return listResponse
	}

	/**
	 * Check the health of the backend service
	 */
	public readonly health = async (): Promise<HealthResponse> => {
		const response = await this.makeRequest("/health", {
			method: "GET",
		})

		return this.validateResponse(response, healthResponseSchema)
	}

	/**
	 * Make an HTTP request to the backend
	 */
	private readonly makeRequest = async (
		endpoint: string,
		options: RequestInit = {},
	): Promise<Response> => {
		const url = `${this.baseUrl}${endpoint}`

		const defaultHeaders = {
			"Content-Type": "application/json",
		}

		const requestOptions: RequestInit = {
			...options,
			headers: {
				...defaultHeaders,
				...options.headers,
			},
		}

		try {
			return await this.httpClient.request(url, requestOptions)
		} catch (error) {
			throw new BackendError(
				`Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
				0,
			)
		}
	}

	/**
	 * Validate response and parse JSON with schema validation
	 */
	private readonly validateResponse = async <T>(
		response: Response,
		schema: z.ZodSchema<T>,
	): Promise<T> => {
		let responseData: unknown

		try {
			responseData = await response.json()
		} catch (error) {
			throw new BackendError(
				`Invalid JSON response: ${error instanceof Error ? error.message : "Unknown error"}`,
				response.status,
			)
		}

		if (!response.ok) {
			// Try to parse as error response
			const errorResult = errorResponseSchema.safeParse(responseData)
			const errorResponse = errorResult.success
				? errorResult.data
				: undefined

			throw new BackendError(
				errorResponse?.error ||
					`HTTP ${response.status}: ${response.statusText}`,
				response.status,
				errorResponse,
			)
		}

		// Validate successful response
		const result = schema.safeParse(responseData)
		if (!result.success) {
			throw new BackendError(
				`Invalid response schema: ${result.error.message}`,
				response.status,
			)
		}

		return result.data
	}

	/**
	 * Ensure the client is authenticated before making a request
	 */
	private readonly ensureAuthenticated = (): void => {
		if (!this.isAuthenticated()) {
			throw new BackendError("Authentication required", 401)
		}
	}
}
