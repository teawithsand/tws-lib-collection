import { Request, Response } from "express"
import { promises as fs } from "fs"
import path from "path"
import { AuthenticatedRequest } from "../auth/AuthService"

/**
 * Collection service for handling collection storage and retrieval
 */
export class CollectionService {
	private readonly collectionsDir: string

	constructor(dataDir: string) {
		this.collectionsDir = path.join(dataDir, "collections")
	}

	/**
	 * Get a collection by ID
	 */
	public readonly getCollection = async (
		req: Request,
		res: Response,
	): Promise<void> => {
		try {
			const { id } = req.params

			if (!id) {
				res.status(400).json({ error: "Collection ID is required" })
				return
			}

			await this.ensureCollectionsDirectory()

			const collectionPath = path.join(this.collectionsDir, `${id}.json`)

			try {
				const data = await fs.readFile(collectionPath, "utf-8")
				const collection = JSON.parse(data)
				res.json(collection)
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code === "ENOENT") {
					res.status(404).json({ error: "Collection not found" })
				} else {
					throw error
				}
			}
		} catch (error) {
			console.error("Get collection error:", error)
			res.status(500).json({ error: "Internal server error" })
		}
	}

	/**
	 * Save a collection (requires authentication)
	 */
	public readonly saveCollection = async (
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> => {
		try {
			const { id } = req.params
			const collectionData = req.body

			if (!id) {
				res.status(400).json({ error: "Collection ID is required" })
				return
			}

			if (!collectionData || typeof collectionData !== "object") {
				res.status(400).json({
					error: "Valid collection data is required",
				})
				return
			}

			await this.ensureCollectionsDirectory()

			const collectionPath = path.join(this.collectionsDir, `${id}.json`)

			// Add metadata to the collection
			const collectionWithMetadata = {
				...collectionData,
				id,
				savedAt: new Date().toISOString(),
				savedBy: req.user?.username,
			}

			await fs.writeFile(
				collectionPath,
				JSON.stringify(collectionWithMetadata, null, 2),
			)

			res.json({
				message: "Collection saved successfully",
				id,
				savedAt: collectionWithMetadata.savedAt,
			})
		} catch (error) {
			console.error("Save collection error:", error)
			res.status(500).json({ error: "Internal server error" })
		}
	}

	/**
	 * List all collections
	 */
	public readonly listCollections = async (
		req: Request,
		res: Response,
	): Promise<void> => {
		try {
			await this.ensureCollectionsDirectory()

			// Read all files in the collections directory
			const files = await fs.readdir(this.collectionsDir)
			const jsonFiles = files.filter((file) => file.endsWith(".json"))

			const collections = []

			for (const file of jsonFiles) {
				const collectionPath = path.join(this.collectionsDir, file)
				try {
					const data = await fs.readFile(collectionPath, "utf-8")
					const collection = JSON.parse(data)

					// Return summary information about each collection
					collections.push({
						id: collection.id || file.replace(".json", ""),
						savedAt: collection.savedAt,
						savedBy: collection.savedBy,
						// Add any other metadata you want to include in the list
					})
				} catch (error) {
					// Skip invalid JSON files
					console.warn(
						`Skipping invalid collection file: ${file}`,
						error,
					)
				}
			}

			// Sort by savedAt date, newest first
			collections.sort((a, b) => {
				if (!a.savedAt && !b.savedAt) return 0
				if (!a.savedAt) return 1
				if (!b.savedAt) return -1
				return (
					new Date(b.savedAt).getTime() -
					new Date(a.savedAt).getTime()
				)
			})

			res.json({
				collections,
				total: collections.length,
			})
		} catch (error) {
			console.error("List collections error:", error)
			res.status(500).json({ error: "Internal server error" })
		}
	}

	/**
	 * Ensure the collections directory exists
	 */
	private readonly ensureCollectionsDirectory = async (): Promise<void> => {
		try {
			await fs.access(this.collectionsDir)
		} catch {
			await fs.mkdir(this.collectionsDir, { recursive: true })
		}
	}
}
