import { createStore } from "@teawithsand/fstate"
import { beforeEach, describe, expect, test, vi } from "vitest"
import { BackendService } from "./backendService"
import { AuthResponse, BackendClient, BackendError } from "./client"

const createMockBackendClient = (): BackendClient => {
	return {
		login: vi.fn(),
		register: vi.fn(),
		logout: vi.fn(),
		getAuthToken: vi.fn(),
		setAuthToken: vi.fn(),
		isAuthenticated: vi.fn(),
		saveCollection: vi.fn(),
		getCollection: vi.fn(),
		listCollections: vi.fn(),
		health: vi.fn(),
	} as unknown as BackendClient
}

describe("BackendService", () => {
	let service: BackendService
	let mockBackendClient: BackendClient
	let store: ReturnType<typeof createStore>

	beforeEach(() => {
		vi.clearAllMocks()
		mockBackendClient = createMockBackendClient()
		service = new BackendService({ backendClient: mockBackendClient })
		store = createStore()
	})

	describe("authState", () => {
		test("should return unauthenticated state initially", () => {
			const authState = store.get(service.authState)

			expect(authState).toEqual({
				token: null,
				user: null,
				isAuthenticated: false,
			})
		})

		test("should return authenticated state when token and user are set", () => {
			const mockUser = {
				id: "1",
				username: "testuser",
				createdAt: "2023-01-01",
			}
			const mockToken = "test-token"

			store.set(service["_authToken"], mockToken)
			store.set(service["_currentUser"], mockUser)

			const authState = store.get(service.authState)

			expect(authState).toEqual({
				token: mockToken,
				user: mockUser,
				isAuthenticated: true,
			})
		})

		test("should be unauthenticated when only token is set", () => {
			store.set(service["_authToken"], "test-token")

			const authState = store.get(service.authState)

			expect(authState.isAuthenticated).toBe(false)
		})

		test("should be unauthenticated when only user is set", () => {
			const mockUser = {
				id: "1",
				username: "testuser",
				createdAt: "2023-01-01",
			}
			store.set(service["_currentUser"], mockUser)

			const authState = store.get(service.authState)

			expect(authState.isAuthenticated).toBe(false)
		})
	})

	describe("hasStoredCredentials", () => {
		test("should return false initially", () => {
			const hasCredentials = store.get(service.hasStoredCredentials)
			expect(hasCredentials).toBe(false)
		})

		test("should return true when credentials are stored", () => {
			store.set(service["_storedCredentials"], {
				username: "testuser",
				password: "testpass",
			})

			const hasCredentials = store.get(service.hasStoredCredentials)
			expect(hasCredentials).toBe(true)
		})
	})

	describe("login", () => {
		test("should successfully login and update authentication state", async () => {
			const loginData = { username: "testuser", password: "testpass" }
			const mockAuthResponse: AuthResponse = {
				token: "test-token",
				user: {
					id: "1",
					username: "testuser",
					createdAt: "2023-01-01",
				},
				message: "Login successful",
			}

			vi.mocked(mockBackendClient.login).mockResolvedValue(
				mockAuthResponse,
			)

			await store.set(service.login, loginData)

			expect(mockBackendClient.login).toHaveBeenCalledWith(loginData)

			const authState = store.get(service.authState)
			expect(authState.token).toBe("test-token")
			expect(authState.user).toEqual(mockAuthResponse.user)
			expect(authState.isAuthenticated).toBe(true)

			const hasCredentials = store.get(service.hasStoredCredentials)
			expect(hasCredentials).toBe(true)
		})

		test("should clear authentication state on login error", async () => {
			const loginData = { username: "testuser", password: "wrongpass" }
			const loginError = new BackendError("Invalid credentials", 401)

			vi.mocked(mockBackendClient.login).mockRejectedValue(loginError)

			store.set(service["_authToken"], "existing-token")
			store.set(service["_currentUser"], {
				id: "1",
				username: "user",
				createdAt: "2023-01-01",
			})

			await expect(store.set(service.login, loginData)).rejects.toThrow(
				loginError,
			)

			const authState = store.get(service.authState)
			expect(authState.token).toBeNull()
			expect(authState.user).toBeNull()
			expect(authState.isAuthenticated).toBe(false)
		})
	})

	describe("register", () => {
		test("should successfully register and update authentication state", async () => {
			const registrationData = {
				username: "newuser",
				password: "newpass",
			}
			const mockAuthResponse: AuthResponse = {
				token: "new-token",
				user: { id: "2", username: "newuser", createdAt: "2023-01-01" },
				message: "Registration successful",
			}

			vi.mocked(mockBackendClient.register).mockResolvedValue(
				mockAuthResponse,
			)

			await store.set(service.register, registrationData)

			expect(mockBackendClient.register).toHaveBeenCalledWith(
				registrationData,
			)

			const authState = store.get(service.authState)
			expect(authState.token).toBe("new-token")
			expect(authState.user).toEqual(mockAuthResponse.user)
			expect(authState.isAuthenticated).toBe(true)

			const hasCredentials = store.get(service.hasStoredCredentials)
			expect(hasCredentials).toBe(true)
		})

		test("should clear authentication state on registration error", async () => {
			const registrationData = {
				username: "existinguser",
				password: "password",
			}
			const registrationError = new BackendError(
				"User already exists",
				409,
			)

			vi.mocked(mockBackendClient.register).mockRejectedValue(
				registrationError,
			)

			store.set(service["_authToken"], "existing-token")
			store.set(service["_currentUser"], {
				id: "1",
				username: "user",
				createdAt: "2023-01-01",
			})

			await expect(
				store.set(service.register, registrationData),
			).rejects.toThrow(registrationError)

			const authState = store.get(service.authState)
			expect(authState.token).toBeNull()
			expect(authState.user).toBeNull()
			expect(authState.isAuthenticated).toBe(false)
		})
	})

	describe("logout", () => {
		test("should clear all authentication state", () => {
			store.set(service["_authToken"], "test-token")
			store.set(service["_currentUser"], {
				id: "1",
				username: "user",
				createdAt: "2023-01-01",
			})
			store.set(service["_storedCredentials"], {
				username: "user",
				password: "pass",
			})

			store.set(service.logout)

			expect(mockBackendClient.logout).toHaveBeenCalled()

			const authState = store.get(service.authState)
			expect(authState.token).toBeNull()
			expect(authState.user).toBeNull()
			expect(authState.isAuthenticated).toBe(false)

			const hasCredentials = store.get(service.hasStoredCredentials)
			expect(hasCredentials).toBe(false)
		})
	})

	describe("reLogin", () => {
		test("should successfully re-login with stored credentials", async () => {
			const storedCredentials = {
				username: "testuser",
				password: "testpass",
			}
			const mockAuthResponse: AuthResponse = {
				token: "refreshed-token",
				user: {
					id: "1",
					username: "testuser",
					createdAt: "2023-01-01",
				},
				message: "Re-login successful",
			}

			store.set(service["_storedCredentials"], storedCredentials)
			vi.mocked(mockBackendClient.login).mockResolvedValue(
				mockAuthResponse,
			)

			await store.set(service.reLogin)

			expect(mockBackendClient.login).toHaveBeenCalledWith(
				storedCredentials,
			)

			const authState = store.get(service.authState)
			expect(authState.token).toBe("refreshed-token")
			expect(authState.user).toEqual(mockAuthResponse.user)
			expect(authState.isAuthenticated).toBe(true)
		})

		test("should throw error when no stored credentials are available", async () => {
			await expect(store.set(service.reLogin)).rejects.toThrow(
				"No stored credentials available for re-login",
			)

			expect(mockBackendClient.login).not.toHaveBeenCalled()
		})

		test("should clear authentication state on re-login error but keep stored credentials", async () => {
			const storedCredentials = {
				username: "testuser",
				password: "testpass",
			}
			const reLoginError = new BackendError("Session expired", 401)

			store.set(service["_storedCredentials"], storedCredentials)
			store.set(service["_authToken"], "old-token")
			store.set(service["_currentUser"], {
				id: "1",
				username: "user",
				createdAt: "2023-01-01",
			})

			vi.mocked(mockBackendClient.login).mockRejectedValue(reLoginError)

			await expect(store.set(service.reLogin)).rejects.toThrow(
				reLoginError,
			)

			const authState = store.get(service.authState)
			expect(authState.token).toBeNull()
			expect(authState.user).toBeNull()
			expect(authState.isAuthenticated).toBe(false)

			const hasCredentials = store.get(service.hasStoredCredentials)
			expect(hasCredentials).toBe(true)
		})
	})

	describe("clearStoredCredentials", () => {
		test("should clear stored credentials", () => {
			store.set(service["_storedCredentials"], {
				username: "user",
				password: "pass",
			})

			store.set(service.clearStoredCredentials)

			const hasCredentials = store.get(service.hasStoredCredentials)
			expect(hasCredentials).toBe(false)
		})
	})

	describe("initializeFromBackendClient", () => {
		test("should initialize auth token from backend client", () => {
			const existingToken = "existing-token"
			vi.mocked(mockBackendClient.getAuthToken).mockReturnValue(
				existingToken,
			)

			store.set(service.initializeFromBackendClient)

			expect(mockBackendClient.getAuthToken).toHaveBeenCalled()

			const authState = store.get(service.authState)
			expect(authState.token).toBe(existingToken)
		})

		test("should not set token when backend client has no token", () => {
			vi.mocked(mockBackendClient.getAuthToken).mockReturnValue(null)

			store.set(service.initializeFromBackendClient)

			expect(mockBackendClient.getAuthToken).toHaveBeenCalled()

			const authState = store.get(service.authState)
			expect(authState.token).toBeNull()
		})
	})
})
