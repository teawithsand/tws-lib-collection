import { afterEach, beforeEach, describe, expect, test } from "vitest"
import { createTestFs, FsType, TestFs } from "./testingSetup"

// Parameterized tests for both file system types
const fsTypes = [FsType.IN_MEMORY, FsType.OPFS]

fsTypes.forEach((fsType) => {
	describe(`Basic FS tests - ${fsType}`, () => {
		let testFs: TestFs

		beforeEach(async () => {
			testFs = await createTestFs(fsType)
		})

		afterEach(async () => {
			if (testFs) {
				await testFs.release()
			}
		})

		test("should create file system and get root directory", async () => {
			// Act
			const rootDir = await testFs.fs.getRootDir()

			// Assert
			expect(rootDir).toBeDefined()
			expect(rootDir.name).toBe("")
			expect(rootDir.path.toString()).toBe(".")
		})
	})
})
