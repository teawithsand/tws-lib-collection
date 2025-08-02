import { Errors } from "@teawithsand/lngext"
import { FsError } from "./error"

export const PathError = Errors.makeErrorType("PathError", FsError)
export const PathParseError = Errors.makeErrorType("PathParseError", PathError)

/**
 * Represents a file system path with utilities for parsing, normalization, and manipulation.
 * Handles Linux-style paths with forward slashes as separators.
 *
 * Note: Paths are normalized to prevent directory traversal attacks. The path cannot
 * navigate above the root level - any ".." segments that would go beyond the root
 * are ignored rather than added to the path. This ensures all paths remain within
 * a safe boundary and cannot escape the intended directory structure.
 *
 * This makes difference during concatenation so that Path(asdf) + Path("..") is still Path(asdf),
 * since Path("..") was evaluated as Path("."), just like Path("../..") would be.
 */
export class Path {
	private readonly segments: readonly string[]

	/**
	 * Creates a new path, which points to the current directory.
	 * @returns Path
	 */
	public static readonly cwd = (): Path => {
		return Path.fromSegment("")
	}

	/**
	 * Creates a new Path instance from path segments.
	 * @param segments - The path segments (already split and filtered)
	 */
	private constructor(segments: string[]) {
		this.segments = this.normalizePath(segments)
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
				if (normalized.length > 0) {
					// If there are actual path segments, ".." cancels out the last one
					normalized.pop()
				}
				// If we're at root level (normalized.length === 0),
				// we ignore ".." rather than adding it, treating it as staying at root
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
			return ""
		}

		return this.segments.join("/")
	}

	/**
	 * Concatenates this path with another path or path segments.
	 * @param other - Another Path instance or string to concatenate
	 * @returns A new Path instance representing the concatenated path
	 */
	public readonly concat = (other: Path | string): Path => {
		const otherPath = other instanceof Path ? other : Path.parse(other)
		const combinedSegments = [...this.segments, ...otherPath.segments]
		const normalizedSegments = this.normalizePath(combinedSegments)
		return new Path([...normalizedSegments])
	}

	/**
	 * Joins multiple path segments to this path.
	 * @param segments - Path segments to join (none should contain "/")
	 * @returns A new Path instance with the joined segments
	 * @throws PathParseError if any segment contains "/"
	 */
	public readonly join = (...segments: string[]): Path => {
		if (segments.length === 0) {
			return this
		}

		// Validate that no segment contains "/"
		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i]
			if (segment && segment.includes("/")) {
				throw new PathParseError(
					`Segment at index ${i} cannot contain "/": ${segment}`,
				)
			}
		}

		const joinedSegments = segments.join("/")
		return this.concat(joinedSegments)
	}

	/**
	 * Returns the parent directory path.
	 * @returns A new Path instance representing the parent directory, or null if at root
	 */
	public readonly parent = (): Path | null => {
		if (this.segments.length === 0) {
			return null
		}
		const parentSegments = this.segments.slice(0, -1)
		return new Path(parentSegments)
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
	 *
	 * @deprecated Instead use parse
	 */
	public static readonly from = (pathString: string): Path => {
		return Path.parse(pathString)
	}

	/**
	 * Creates a Path instance from a string.
	 * @param pathString - The path string to parse
	 * @returns A new Path instance
	 */
	public static readonly parse = (pathString: string): Path => {
		const trimmed = pathString.trim()
		const rawSegments = trimmed
			.split("/")
			.filter((segment) => segment !== "")
		return new Path(rawSegments)
	}

	/**
	 * Resolves multiple path segments into a single normalized path.
	 * @param segments - Path segments to resolve
	 * @returns A new Path instance with resolved segments
	 */
	public static readonly resolve = (...segments: string[]): Path => {
		if (segments.length === 0) {
			return Path.parse(".")
		}
		// Join all segments with "/" and then parse as a single path
		// This allows proper normalization of ".." segments across all segments
		const joinedPath = segments.join("/")
		return Path.parse(joinedPath)
	}

	/**
	 * Creates a Path instance from a single segment.
	 * @param segment - The single path segment (must not contain "/")
	 * @returns A new Path instance
	 * @throws PathParseError if segment contains "/"
	 */
	public static readonly fromSegment = (segment: string): Path => {
		if (segment.includes("/")) {
			throw new PathParseError(`Segment cannot contain "/": ${segment}`)
		}
		return new Path([segment])
	}

	/**
	 * Creates a Path instance from an array of segments.
	 * @param segments - Array of path segments (none should contain "/")
	 * @returns A new Path instance
	 * @throws PathParseError if any segment contains "/"
	 */
	public static readonly fromSegments = (segments: string[]): Path => {
		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i]
			if (segment && segment.includes("/")) {
				throw new PathParseError(
					`Segment at index ${i} cannot contain "/": ${segment}`,
				)
			}
		}
		return new Path(segments)
	}
}
