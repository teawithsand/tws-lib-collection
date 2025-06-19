import { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import {
	UserLoginData,
	UserRegistrationData,
	UserRepository,
} from "../users/types"

const JWT_SECRET =
	process.env.JWT_SECRET || "your-secret-key-change-this-in-production"
const JWT_EXPIRES_IN = "24h"

/**
 * Interface for JWT payload
 */
interface JwtPayload {
	readonly userId: string
	readonly username: string
}

/**
 * Extended Request interface with user information
 */
export interface AuthenticatedRequest extends Request {
	user?: JwtPayload
}

/**
 * Authentication service handling user registration, login, and JWT token validation
 */
export class AuthService {
	constructor(private readonly userRepository: UserRepository) {}

	/**
	 * Register a new user
	 */
	public readonly register = async (
		req: Request,
		res: Response,
	): Promise<void> => {
		try {
			const { username, password } = req.body as UserRegistrationData

			// Validate input
			if (!username || !password) {
				res.status(400).json({
					error: "Username and password are required",
				})
				return
			}

			if (username.length < 3) {
				res.status(400).json({
					error: "Username must be at least 3 characters long",
				})
				return
			}

			if (password.length < 6) {
				res.status(400).json({
					error: "Password must be at least 6 characters long",
				})
				return
			}

			// Check if username already exists
			if (await this.userRepository.usernameExists(username)) {
				res.status(409).json({ error: "Username already exists" })
				return
			}

			// Hash password (simple approach for PoC - in production, use bcrypt)
			const passwordHash = this.hashPassword(password)

			// Create user
			const user = await this.userRepository.create({
				username,
				passwordHash,
			})

			// Generate JWT token
			const token = this.generateToken({
				userId: user.id,
				username: user.username,
			})

			res.status(201).json({
				message: "User registered successfully",
				token,
				user: {
					id: user.id,
					username: user.username,
					createdAt: user.createdAt,
				},
			})
		} catch (error) {
			console.error("Registration error:", error)
			res.status(500).json({ error: "Internal server error" })
		}
	}

	/**
	 * Login a user
	 */
	public readonly login = async (
		req: Request,
		res: Response,
	): Promise<void> => {
		try {
			const { username, password } = req.body as UserLoginData

			// Validate input
			if (!username || !password) {
				res.status(400).json({
					error: "Username and password are required",
				})
				return
			}

			// Find user
			const user = await this.userRepository.findByUsername(username)
			if (!user) {
				res.status(401).json({ error: "Invalid credentials" })
				return
			}

			// Verify password
			if (!this.verifyPassword(password, user.passwordHash)) {
				res.status(401).json({ error: "Invalid credentials" })
				return
			}

			// Generate JWT token
			const token = this.generateToken({
				userId: user.id,
				username: user.username,
			})

			res.json({
				message: "Login successful",
				token,
				user: {
					id: user.id,
					username: user.username,
					createdAt: user.createdAt,
				},
			})
		} catch (error) {
			console.error("Login error:", error)
			res.status(500).json({ error: "Internal server error" })
		}
	}

	/**
	 * Middleware to authenticate JWT tokens
	 */
	public readonly authenticate = (
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): void => {
		try {
			const authHeader = req.headers.authorization
			if (!authHeader || !authHeader.startsWith("Bearer ")) {
				res.status(401).json({ error: "Access token required" })
				return
			}

			const token = authHeader.substring(7)
			const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload

			// Add user info to request
			;(req as AuthenticatedRequest).user = decoded
			next()
		} catch (error) {
			console.error("Authentication error:", error)
			res.status(401).json({ error: "Invalid or expired token" })
		}
	}

	/**
	 * Generate a JWT token
	 */
	private readonly generateToken = (payload: JwtPayload): string => {
		return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
	}

	/**
	 * Hash a password (simple approach for PoC)
	 * Note: In production, use bcrypt or similar
	 */
	private readonly hashPassword = (password: string): string => {
		// Simple hash for PoC - in production, use bcrypt
		return Buffer.from(password + "salt").toString("base64")
	}

	/**
	 * Verify a password against its hash
	 */
	private readonly verifyPassword = (
		password: string,
		hash: string,
	): boolean => {
		const expectedHash = this.hashPassword(password)
		return expectedHash === hash
	}
}
