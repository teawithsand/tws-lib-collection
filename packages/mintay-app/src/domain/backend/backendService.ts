import { atom, loadable } from "@teawithsand/fstate"
import { BackendCollectionData } from "./backendCollectionData"
import {
	BackendClient,
	BackendError,
	User,
	UserLoginData,
	UserRegistrationData,
} from "./client"

export interface AuthState {
	readonly token: string | null
	readonly user: User | null
	readonly isAuthenticated: boolean
}

export interface StoredCredentials {
	readonly username: string
	readonly password: string
}

export interface BackendServiceConfig {
	readonly backendClient: BackendClient
}

export class BackendService {
	private readonly backendClient: BackendClient

	constructor({ backendClient }: BackendServiceConfig) {
		this.backendClient = backendClient
	}

	private readonly _authToken = atom<string | null>(null)
	private readonly _currentUser = atom<User | null>(null)
	private readonly _storedCredentials = atom<StoredCredentials | null>(null)

	public readonly authState = atom<AuthState>((get) => {
		const token = get(this._authToken)
		const user = get(this._currentUser)
		return {
			token,
			user,
			isAuthenticated: token !== null && user !== null,
		}
	})

	public readonly authStateLoadable = loadable(this.authState)

	public readonly hasStoredCredentials = atom<boolean>((get) => {
		const credentials = get(this._storedCredentials)
		return credentials !== null
	})

	public readonly login = atom(
		null,
		async (_get, set, loginData: UserLoginData): Promise<void> => {
			try {
				const authResponse = await this.backendClient.login(loginData)

				set(this._authToken, authResponse.token)
				set(this._currentUser, authResponse.user)
				set(this._storedCredentials, {
					username: loginData.username,
					password: loginData.password,
				})
			} catch (error) {
				set(this._authToken, null)
				set(this._currentUser, null)
				throw error
			}
		},
	)

	public readonly register = atom(
		null,
		async (
			_get,
			set,
			registrationData: UserRegistrationData,
		): Promise<void> => {
			try {
				const authResponse =
					await this.backendClient.register(registrationData)

				set(this._authToken, authResponse.token)
				set(this._currentUser, authResponse.user)
				set(this._storedCredentials, {
					username: registrationData.username,
					password: registrationData.password,
				})
			} catch (error) {
				set(this._authToken, null)
				set(this._currentUser, null)
				throw error
			}
		},
	)

	public readonly logout = atom(null, (_get, set): void => {
		this.backendClient.logout()

		set(this._authToken, null)
		set(this._currentUser, null)
		set(this._storedCredentials, null)
	})

	public readonly reLogin = atom(null, async (get, set): Promise<void> => {
		const credentials = get(this._storedCredentials)
		if (!credentials) {
			throw new BackendError(
				"No stored credentials available for re-login",
				400,
			)
		}

		try {
			const authResponse = await this.backendClient.login(credentials)

			set(this._authToken, authResponse.token)
			set(this._currentUser, authResponse.user)
		} catch (error) {
			set(this._authToken, null)
			set(this._currentUser, null)
			throw error
		}
	})

	public readonly clearStoredCredentials = atom(null, (_get, set): void => {
		set(this._storedCredentials, null)
	})

	public readonly initializeFromBackendClient = atom(
		null,
		(_get, set): void => {
			const token = this.backendClient.getAuthToken()
			if (token) {
				set(this._authToken, token)
			}
		},
	)

	// Collection-related atoms and methods
	private readonly _collections = atom<BackendCollectionData[]>([])
	private readonly _selectedCollection = atom<BackendCollectionData | null>(
		null,
	)

	public readonly collections = atom<BackendCollectionData[]>((get) => {
		return get(this._collections)
	})

	public readonly collectionsLoadable = loadable(this.collections)

	public readonly selectedCollection = atom<BackendCollectionData | null>(
		(get) => {
			return get(this._selectedCollection)
		},
	)

	public readonly selectedCollectionLoadable = loadable(
		this.selectedCollection,
	)

	public readonly fetchCollections = atom(
		null,
		async (_get, set): Promise<void> => {
			try {
				const collections = await this.backendClient.listCollections()
				set(this._collections, collections)
			} catch (error) {
				console.error("Failed to fetch collections:", error)
				throw error
			}
		},
	)

	public readonly fetchCollection = atom(
		null,
		async (_get, set, collectionId: string): Promise<void> => {
			try {
				const collection =
					await this.backendClient.getCollection(collectionId)
				set(this._selectedCollection, collection)
			} catch (error) {
				console.error("Failed to fetch collection:", error)
				set(this._selectedCollection, null)
				throw error
			}
		},
	)

	public readonly saveCollection = atom(
		null,
		async (_get, _set, data: BackendCollectionData): Promise<void> => {
			try {
				await this.backendClient.saveCollection(data)
				// Optionally refresh collections list after saving
			} catch (error) {
				console.error("Failed to save collection:", error)
				throw error
			}
		},
	)
}
