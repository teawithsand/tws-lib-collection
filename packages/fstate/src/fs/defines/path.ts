import { Errors } from "@teawithsand/lngext"
import { FsError } from "./error"

export const PathError = Errors.makeErrorType("PathError", FsError)
export const PathParseError = Errors.makeErrorType("PathParseError", PathError)

/**
 * Represents a file system path with utilities for parsing, normalization, and manipulation.
 * Handles Linux-style paths with forward slashes as separators.
 */
export class Path {
	private readonly segments: readonly string[]

	/**
	 * Creates a new Path instance from a string path.
	 * @param pathString - The path string to parse (Linux-style with forward slashes)
	 */
	public constructor(pathString: string) {
		const trimmed = pathString.trim()
		const rawSegments = trimmed
			.split("/")
			.filter((segment) => segment !== "")
		this.segments = this.normalizePath(rawSegments)
	}

	/**
	 * Normalizes a path by resolving . and .. segments.
	 * @param segments - Array of path segments to normalize
	 * @returns Normalized array of path segments
	 */
	private readonly normalizePath = (
		segments: string[],
	): readonly string[] => {
		const normalized: string[] = []

		for (const segment of segments) {
			if (segment === "." || segment === "") {
				continue
			} else if (segment === "..") {
				if (
					normalized.length > 0 &&
					normalized[normalized.length - 1] !== ".."
				) {
					normalized.pop()
				} else {
					normalized.push("..")
				}
			} else {
				normalized.push(segment)
			}
		}

		return normalized
	}

	/**
	 * Returns the string representation of this path.
	 * @returns The normalized path as a string
	 */
	public readonly toString = (): string => {
		if (this.segments.length === 0) {
			return "."
		}

		return this.segments.join("/")
	}

	/**
	 * Concatenates this path with another path or path segments.
	 * @param other - Another Path instance or string to concatenate
	 * @returns A new Path instance representing the concatenated path
	 */
	public readonly concat = (other: Path | string): Path => {
		const otherPath = other instanceof Path ? other : new Path(other)
		const combinedSegments = [...this.segments, ...otherPath.segments]
		const combinedString = combinedSegments.join("/")
		return new Path(combinedString)
	}

	/**
	 * Joins multiple path segments to this path.
	 * @param segments - Path segments to join
	 * @returns A new Path instance with the joined segments
	 */
	public readonly join = (...segments: string[]): Path => {
		if (segments.length === 0) {
			return this
		}
		const joinedSegments = segments.join("/")
		return this.concat(joinedSegments)
	}

	/**
	 * Returns whether this path is absolute (starts with /).
	 * @returns Always false since all paths are treated uniformly
	 */
	public readonly isAbsolutePath = (): boolean => {
		return false
	}

	/**
	 * Returns the parent directory path.
	 * @returns A new Path instance representing the parent directory, or null if at root
	 */
	public readonly parent = (): Path | null => {
		if (this.segments.length === 0) {
			return new Path("..")
		}
		const parentSegments = this.segments.slice(0, -1)
		const parentString = parentSegments.join("/") || "."
		return new Path(parentString)
	}

	/**
	 * Returns the last segment of the path (filename or directory name).
	 * @returns The last path segment, or null if the path is root
	 */
	public readonly basename = (): string | null => {
		if (this.segments.length === 0) {
			return null
		}
		return this.segments[this.segments.length - 1] ?? null
	}

	/**
	 * Returns all path segments as an array.
	 * @returns Readonly array of path segments
	 */
	public readonly getSegments = (): readonly string[] => {
		return this.segments
	}

	/**
	 * Checks if this path equals another path.
	 * @param other - Another Path instance to compare with
	 * @returns True if the paths are equal, false otherwise
	 */
	public readonly equals = (other: Path): boolean => {
		return (
			this.segments.length === other.segments.length &&
			this.segments.every(
				(segment, index) => segment === other.segments[index],
			)
		)
	}

	/**
	 * Creates a Path instance from a string.
	 * @param pathString - The path string to parse
	 * @returns A new Path instance
	 */
	public static readonly from = (pathString: string): Path => {
		return new Path(pathString)
	}

	/**
	 * Resolves multiple path segments into a single normalized path.
	 * @param segments - Path segments to resolve
	 * @returns A new Path instance with resolved segments
	 */
	public static readonly resolve = (...segments: string[]): Path => {
		if (segments.length === 0) {
			return new Path(".")
		}
		const firstSegment = segments[0]
		if (!firstSegment) {
			throw new PathParseError("First path segment cannot be undefined")
		}
		let result = new Path(firstSegment)
		for (let i = 1; i < segments.length; i++) {
			const segment = segments[i]
			if (segment) {
				result = result.concat(segment)
			}
		}
		return result
	}
}
