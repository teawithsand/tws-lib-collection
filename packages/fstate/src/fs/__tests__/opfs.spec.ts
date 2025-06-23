import { describe, expect, test } from "vitest"

// Helper to get OPFS root directory
async function getOPFSRoot(): Promise<FileSystemDirectoryHandle> {
	return await navigator.storage.getDirectory()
}

describe("OPFS handle recreation", () => {
	test("Created entry removed and recreated via parent makes first handle valid again", async () => {
		const root = await getOPFSRoot()

		// Step 1: Create a file and get a handle
		const fileName = "testfile.txt"
		const handle = await root.getFileHandle(fileName, { create: true })

		// Ensure handle is valid (file exists)
		let file = await handle.getFile()
		expect(file).toBeDefined()

		// Step 2: Remove the entry via handle (delete the file)
		await root.removeEntry(fileName)
		// Now, trying to access file through handle should fail
		await expect(handle.getFile()).rejects.toThrow()

		// Step 3: Recreate via parent handle (root)
		const newHandle = await root.getFileHandle(fileName, { create: true })
		// Write something to the file (optional)
		const writable = await newHandle.createWritable()
		await writable.write("hello")
		await writable.close()

		// Step 4: The original handle should now be valid again (points to the recreated entry)
		// In browsers, the original handle is valid, but its file is replaced
		file = await handle.getFile()
		expect(file).toBeDefined()
		expect(file.name).toBe(fileName)

		// Optionally, check file content
		const text = await file.text()
		expect(text).toBe("hello")

		// Clean up
		await root.removeEntry(fileName)
	})

	test("Created directory entry removed and recreated via parent makes first handle valid again", async () => {
		const root = await getOPFSRoot()

		// Step 1: Create a directory and get a handle
		const dirName = "testdir"
		const dirHandle = await root.getDirectoryHandle(dirName, {
			create: true,
		})

		// Ensure handle is valid (directory exists)
		// Try to create a file inside the directory
		const subFileName = "foo.txt"
		const subFileHandle = await dirHandle.getFileHandle(subFileName, {
			create: true,
		})
		const writable = await subFileHandle.createWritable()
		await writable.write("bar")
		await writable.close()

		// Step 2: Remove the directory via parent handle (delete the directory recursively)
		await root.removeEntry(dirName, { recursive: true })

		// Now, trying to access the directory via the handle should fail
		await expect(dirHandle.getFileHandle(subFileName)).rejects.toThrow()

		// Step 3: Recreate the directory via parent handle
		const newDirHandle = await root.getDirectoryHandle(dirName, {
			create: true,
		})
		// Create a new file in the new directory
		const newSubFileHandle = await newDirHandle.getFileHandle(subFileName, {
			create: true,
		})
		const newWritable = await newSubFileHandle.createWritable()
		await newWritable.write("baz")
		await newWritable.close()

		// Step 4: The original directory handle should now be valid again (points to the recreated directory)
		// Try to access the new file via the original dirHandle
		const recreatedSubFileHandle =
			await dirHandle.getFileHandle(subFileName)
		const recreatedFile = await recreatedSubFileHandle.getFile()
		expect(recreatedFile).toBeDefined()
		expect(recreatedFile.name).toBe(subFileName)

		// Optionally, check file content
		const recreatedText = await recreatedFile.text()
		expect(recreatedText).toBe("baz")

		// Clean up
		await root.removeEntry(dirName, { recursive: true })
	})
})
