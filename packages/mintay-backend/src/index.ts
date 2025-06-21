import cors from "cors"
import express from "express"
import { promises as fs } from "fs"
import path from "path"
import { AuthService } from "./auth/AuthService"
import { CollectionService } from "./collections/CollectionService"
import { FileUserRepository } from "./users/FileUserRepository"

const PORT = process.env.PORT || 3000
const DATA_DIR = path.join(__dirname, "../data")

/**
 * Main application class for the Mintay backend server
 */
export class App {
	private readonly app = express()
	private readonly authService: AuthService
	private readonly collectionService: CollectionService

	constructor() {
		const userRepository = new FileUserRepository(DATA_DIR)
		this.authService = new AuthService(userRepository)
		this.collectionService = new CollectionService(DATA_DIR)
	}

	/**
	 * Initialize the application by setting up middleware and routes
	 */
	public readonly initialize = async (): Promise<void> => {
		await this.ensureDataDirectory()
		this.setupMiddleware()
		this.setupRoutes()
	}

	/**
	 * Start the server
	 */
	public readonly start = (): void => {
		this.app.listen(PORT, () => {
			console.log(`Server is running on port ${PORT}`)
		})
	}

	/**
	 * Ensure the data directory exists
	 */
	private readonly ensureDataDirectory = async (): Promise<void> => {
		try {
			await fs.access(DATA_DIR)
		} catch {
			await fs.mkdir(DATA_DIR, { recursive: true })
		}
	}

	/**
	 * Setup Express middleware
	 */
	private readonly setupMiddleware = (): void => {
		this.app.use(cors())
		this.app.use(express.json())
	}

	/**
	 * Setup API routes
	 */
	private readonly setupRoutes = (): void => {
		// Auth routes
		this.app.post("/api/auth/register", this.authService.register)
		this.app.post("/api/auth/login", this.authService.login)

		// Collection routes (protected)
		this.app.get("/api/collections", this.collectionService.listCollections)
		this.app.get(
			"/api/collections/:id",
			this.collectionService.getCollection,
		)
		this.app.put(
			"/api/collections/:id",
			this.authService.authenticate,
			this.collectionService.saveCollection,
		)

		// Health check
		this.app.get("/health", (req, res) => {
			res.json({ status: "ok", timestamp: new Date().toISOString() })
		})
	}
}

// Start the application if this file is run directly
if (require.main === module) {
	const app = new App()
	app.initialize()
		.then(() => {
			app.start()
		})
		.catch((error) => {
			console.error("Failed to start application:", error)
			process.exit(1)
		})
}
