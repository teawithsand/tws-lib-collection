import { AbookEntry } from "@teawithsand/booklibr"
import { createStore } from "@teawithsand/fstate"
import { beforeEach, describe, expect, test } from "vitest"
import { AbookAddFilesWizardBehavior } from "./AbookAddFilesWizardBehavior"

describe("AbookAddFilesWizardBehavior", () => {
	let behavior: AbookAddFilesWizardBehavior
	let store: ReturnType<typeof createStore>

	beforeEach(() => {
		behavior = new AbookAddFilesWizardBehavior()
		store = createStore()
	})

	const createTestFile = (fileName: string): File =>
		new File(["test content"], fileName)

	describe("Initial state", () => {
		test("should initialize with empty filesToUpload", async () => {
			const filesToUpload = store.get(behavior.filesToUpload)
			expect(filesToUpload).toEqual([])
		})

		test("should initialize with empty uploadFilesList", async () => {
			const uploadFilesList = store.get(behavior.filesToUpload)
			expect(uploadFilesList).toEqual([])
		})

		test("should initialize with empty filesList", async () => {
			const filesList = store.get(behavior.filesToShow)
			expect(filesList).toEqual([])
		})
	})

	describe("Setting inputFiles", () => {
		test("should set inputFiles and reflect in derived atoms", async () => {
			const files = [
				createTestFile("file1.txt"),
				createTestFile("file2.txt"),
			]
			store.set(behavior.setInputFiles, files)

			const filesToUpload = store.get(behavior.filesToUpload)
			expect(filesToUpload).toHaveLength(2)
			expect(filesToUpload[0].file).toBeInstanceOf(Blob)

			const uploadFilesList = store.get(behavior.filesToUpload)
			expect(uploadFilesList).toHaveLength(2)
		})

		test("should filter only enabled files for filesToUpload and uploadFilesList", async () => {
			const files = [
				createTestFile("file1.txt"),
				createTestFile("file2.txt"),
				createTestFile("file3.txt"),
			]
			store.set(behavior.setInputFiles, files)

			// Disable the second file
			const filesToShow = store.get(behavior.filesToShow)
			const file2Id = filesToShow[1].id
			store.set(behavior.modifyFile, file2Id, (entry) => ({
				...entry,
				isEnabled: false,
			}))

			const filesToUpload = store.get(behavior.filesToUpload)
			expect(filesToUpload).toHaveLength(2)

			const uploadFilesList = store.get(behavior.filesToUpload)
			expect(uploadFilesList).toHaveLength(2)
		})
	})

	describe("filesList with name conflict detection", () => {
		test("should return false for disabled files", async () => {
			const files = [createTestFile("file1.txt")]
			store.set(behavior.setInputFiles, files)

			const filesToShow = store.get(behavior.filesToShow)
			const fileId = filesToShow[0].id
			store.set(behavior.modifyFile, fileId, (entry) => ({
				...entry,
				isEnabled: false,
			}))

			const updatedFilesList = store.get(behavior.filesToShow)
			expect(updatedFilesList).toHaveLength(1)
			expect(updatedFilesList[0].isNameTakenInAddSet).toBe(false)
			expect(updatedFilesList[0].isNameTakenInPreExistingSet).toBe(false)
		})

		test("should return false for enabled files with unique names", async () => {
			const files = [
				createTestFile("file1.txt"),
				createTestFile("file2.txt"),
			]
			store.set(behavior.setInputFiles, files)

			const filesList = store.get(behavior.filesToShow)
			expect(filesList).toHaveLength(2)

			expect(filesList[0].isNameTakenInAddSet).toBe(false)
			expect(filesList[0].isNameTakenInPreExistingSet).toBe(false)
			expect(filesList[1].isNameTakenInAddSet).toBe(false)
			expect(filesList[1].isNameTakenInPreExistingSet).toBe(false)
		})

		test("should mark duplicates in add set for enabled files", async () => {
			const files = [
				createTestFile("file1.txt"),
				createTestFile("file1.txt"),
				createTestFile("file2.txt"),
			]
			store.set(behavior.setInputFiles, files)

			const filesList = store.get(behavior.filesToShow)
			expect(filesList).toHaveLength(3)

			// First two have same name in add set
			expect(filesList[0].isNameTakenInAddSet).toBe(true)
			expect(filesList[0].isNameTakenInPreExistingSet).toBe(false)
			expect(filesList[1].isNameTakenInAddSet).toBe(true)
			expect(filesList[1].isNameTakenInPreExistingSet).toBe(false)

			// Third has unique name
			expect(filesList[2].isNameTakenInAddSet).toBe(false)
			expect(filesList[2].isNameTakenInPreExistingSet).toBe(false)
		})

		test("should ignore disabled files when checking name uniqueness", async () => {
			const files = [
				createTestFile("file1.txt"),
				createTestFile("file1.txt"),
				createTestFile("file2.txt"),
			]
			store.set(behavior.setInputFiles, files)

			const filesToShow = store.get(behavior.filesToShow)
			const duplicateFileId = filesToShow[1].id
			store.set(behavior.modifyFile, duplicateFileId, (entry) => ({
				...entry,
				isEnabled: false,
			}))

			const updatedFilesList = store.get(behavior.filesToShow)
			expect(updatedFilesList).toHaveLength(3)

			expect(updatedFilesList[0].isNameTakenInAddSet).toBe(false) // only one enabled with this name
			expect(updatedFilesList[0].isNameTakenInPreExistingSet).toBe(false)
			expect(updatedFilesList[1].isNameTakenInAddSet).toBe(false) // disabled
			expect(updatedFilesList[1].isNameTakenInPreExistingSet).toBe(false) // disabled
			expect(updatedFilesList[2].isNameTakenInAddSet).toBe(false)
			expect(updatedFilesList[2].isNameTakenInPreExistingSet).toBe(false)
		})

		test("should detect conflicts with pre-existing files", async () => {
			// Set up some pre-existing files
			const preExistingFiles = [
				{ data: { name: "existing1.txt" } },
				{ data: { name: "existing2.txt" } },
			] as AbookEntry[]
			store.set(behavior.alreadyExistingAbookFiles, preExistingFiles)

			const files = [
				createTestFile("existing1.txt"), // conflicts with pre-existing
				createTestFile("newfile.txt"), // no conflict
			]
			store.set(behavior.setInputFiles, files)

			const filesList = store.get(behavior.filesToShow)
			expect(filesList).toHaveLength(2)

			// First file conflicts with pre-existing
			expect(filesList[0].isNameTakenInAddSet).toBe(false) // unique in add set
			expect(filesList[0].isNameTakenInPreExistingSet).toBe(true) // conflicts with pre-existing

			// Second file has no conflicts
			expect(filesList[1].isNameTakenInAddSet).toBe(false)
			expect(filesList[1].isNameTakenInPreExistingSet).toBe(false)
		})
	})

	describe("Reactivity", () => {
		test("should update derived atoms when inputFiles changes", async () => {
			// Start with empty
			let filesToUpload = store.get(behavior.filesToUpload)
			expect(filesToUpload).toEqual([])

			// Add files
			const files = [createTestFile("file1.txt")]
			store.set(behavior.setInputFiles, files)

			filesToUpload = store.get(behavior.filesToUpload)
			expect(filesToUpload).toHaveLength(1)

			// Disable the file
			const filesToShow = store.get(behavior.filesToShow)
			const fileId = filesToShow[0].id
			store.set(behavior.modifyFile, fileId, (entry) => ({
				...entry,
				isEnabled: false,
			}))

			filesToUpload = store.get(behavior.filesToUpload)
			expect(filesToUpload).toEqual([])
		})
	})
})
