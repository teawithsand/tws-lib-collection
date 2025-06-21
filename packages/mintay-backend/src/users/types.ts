/**
 * User interface for the application
 */
export interface User {
	readonly id: string
	readonly username: string
	readonly passwordHash: string
	readonly createdAt: string
}

/**
 * Interface for user registration data
 */
export interface UserRegistrationData {
	readonly username: string
	readonly password: string
}

/**
 * Interface for user login data
 */
export interface UserLoginData {
	readonly username: string
	readonly password: string
}

/**
 * Repository interface for user operations
 */
export interface UserRepository {
	/**
	 * Find a user by username
	 */
	findByUsername(username: string): Promise<User | null>

	/**
	 * Create a new user
	 */
	create(userData: Omit<User, "id" | "createdAt">): Promise<User>

	/**
	 * Check if a username already exists
	 */
	usernameExists(username: string): Promise<boolean>
}
