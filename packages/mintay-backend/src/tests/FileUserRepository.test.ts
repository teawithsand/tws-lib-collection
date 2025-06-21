import { promises as fs } from "fs"
import path from "path"
import { afterEach, beforeEach, describe, expect, test } from "vitest"
import { FileUserRepository } from "../users/FileUserRepository"

const TEST_DATA_DIR = path.join(__dirname, "../../test-data")

describe("FileUserRepository", () => {
	let repository: FileUserRepository

	beforeEach(async () => {
		// Create test data directory
		await fs.mkdir(TEST_DATA_DIR, { recursive: true })
		repository = new FileUserRepository(TEST_DATA_DIR)
	})

	afterEach(async () => {
		// Clean up test data
		try {
			await fs.rm(TEST_DATA_DIR, { recursive: true, force: true })
		} catch {
			// Ignore cleanup errors
		}
	})

	test("should create a new user", async () => {
		const userData = {
			username: "testuser",
			passwordHash: "hashedpassword123",
		}

		const user = await repository.create(userData)

		expect(user.id).toBeDefined()
		expect(user.username).toBe("testuser")
		expect(user.passwordHash).toBe("hashedpassword123")
		expect(user.createdAt).toBeDefined()
	})

	test("should find user by username", async () => {
		const userData = {
			username: "testuser",
			passwordHash: "hashedpassword123",
		}

		await repository.create(userData)
		const foundUser = await repository.findByUsername("testuser")

		expect(foundUser).toBeDefined()
		expect(foundUser?.username).toBe("testuser")
	})

	test("should return null for non-existent user", async () => {
		const foundUser = await repository.findByUsername("nonexistent")
		expect(foundUser).toBeNull()
	})

	test("should check if username exists", async () => {
		const userData = {
			username: "testuser",
			passwordHash: "hashedpassword123",
		}

		expect(await repository.usernameExists("testuser")).toBe(false)

		await repository.create(userData)

		expect(await repository.usernameExists("testuser")).toBe(true)
		expect(await repository.usernameExists("nonexistent")).toBe(false)
	})

	test("should handle multiple users", async () => {
		const user1Data = {
			username: "user1",
			passwordHash: "hash1",
		}
		const user2Data = {
			username: "user2",
			passwordHash: "hash2",
		}

		const user1 = await repository.create(user1Data)
		const user2 = await repository.create(user2Data)

		expect(user1.id).not.toBe(user2.id)

		const foundUser1 = await repository.findByUsername("user1")
		const foundUser2 = await repository.findByUsername("user2")

		expect(foundUser1?.username).toBe("user1")
		expect(foundUser2?.username).toBe("user2")
	})
})
