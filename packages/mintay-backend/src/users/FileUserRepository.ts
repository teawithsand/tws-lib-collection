import { promises as fs } from "fs"
import path from "path"
import { User, UserRepository } from "./types"

/**
 * File-based user repository implementation
 */
export class FileUserRepository implements UserRepository {
	private readonly usersFilePath: string

	constructor(dataDir: string) {
		this.usersFilePath = path.join(dataDir, "users.json")
	}

	/**
	 * Find a user by username
	 */
	public readonly findByUsername = async (
		username: string,
	): Promise<User | null> => {
		const users = await this.loadUsers()
		return users.find((user) => user.username === username) || null
	}

	/**
	 * Create a new user
	 */
	public readonly create = async (
		userData: Omit<User, "id" | "createdAt">,
	): Promise<User> => {
		const users = await this.loadUsers()

		const newUser: User = {
			id: this.generateId(),
			username: userData.username,
			passwordHash: userData.passwordHash,
			createdAt: new Date().toISOString(),
		}

		users.push(newUser)
		await this.saveUsers(users)

		return newUser
	}

	/**
	 * Check if a username already exists
	 */
	public readonly usernameExists = async (
		username: string,
	): Promise<boolean> => {
		const user = await this.findByUsername(username)
		return user !== null
	}

	/**
	 * Load users from the JSON file
	 */
	private readonly loadUsers = async (): Promise<User[]> => {
		try {
			const data = await fs.readFile(this.usersFilePath, "utf-8")
			return JSON.parse(data) as User[]
		} catch {
			// File doesn't exist or is invalid, return empty array
			return []
		}
	}

	/**
	 * Save users to the JSON file
	 */
	private readonly saveUsers = async (users: User[]): Promise<void> => {
		await fs.writeFile(this.usersFilePath, JSON.stringify(users, null, 2))
	}

	/**
	 * Generate a unique ID for a user
	 */
	private readonly generateId = (): string => {
		return `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
	}
}
