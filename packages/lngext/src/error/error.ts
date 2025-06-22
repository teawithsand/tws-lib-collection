/**
 * BaseError class for all custom errors.
 */
export class BaseError extends Error {
	constructor(
		message: string,
		public readonly cause: any | null = null,
	) {
		super(message)
		this.name = "BaseError"
		// Fix stack trace for V8 (Node.js, Chrome)
		if (typeof (Error as any).captureStackTrace === "function") {
			// (Error as any) is required because captureStackTrace is not in the standard Error type
			;(Error as any).captureStackTrace(this, this.constructor)
		}
	}
}

/**
 * Represents a parsed stack frame from an error stack trace.
 */
export interface StackFrame {
	/** The function name, or null if not available */
	functionName: string | null
	/** The file name or URL */
	fileName: string | null
	/** The line number, or null if not available */
	lineNumber: number | null
	/** The column number, or null if not available */
	columnNumber: number | null
	/** The raw stack trace line */
	raw: string
}

export class Errors {
	private constructor() {}

	/**
	 * Creates a custom error type with a specific name using mixin pattern.
	 * @param name - The name for the error type
	 * @param error - The base error class to extend
	 * @returns A new error class with the specified name
	 */
	public static readonly makeErrorType = <
		T extends new (...args: any[]) => BaseError,
	>(
		name: string,
		error: T,
	): T => {
		const ErrorClass = class extends error {
			constructor(...args: any[]) {
				super(...args)
				this.name = name
				Object.setPrototypeOf(this, new.target.prototype)
			}
		}

		return ErrorClass as T
	}

	/**
	 * Creates a custom error type with a specific name and typed data property.
	 * Supports inheritance: you can pass a base error class to extend.
	 * If the base error requires data, you must provide an extractor function to convert the new error's data to the base error's data.
	 * The resulting error class constructor accepts (message: string, data: D, cause?: any).
	 * If the cause is another error of the same type, its data is shallow-copied into the new error's data.
	 * @param name - The name for the error type
	 * @param Base - The base error class to extend (defaults to BaseError)
	 * @param baseDataExtractor - Optional function to extract base data from new data
	 * @returns A new error class with the specified name and data property
	 */
	public static readonly makeErrorTypeWithData = <
		D,
		TBase extends new (...args: any[]) => BaseError,
	>(
		name: string,
		Base: TBase,
		baseDataExtractor?: (data: D) => any,
	) => {
		const Parent = Base

		class ErrorWithData extends (Parent as new (
			...args: any[]
		) => BaseError) {
			public readonly data: D

			public constructor(
				message: string,
				data: D,
				cause: any | null = null,
			) {
				const baseData = baseDataExtractor
					? baseDataExtractor(data)
					: undefined
				if (baseDataExtractor) {
					super(message, baseData, cause)
				} else {
					super(message, cause)
				}
				if (cause instanceof ErrorWithData) {
					this.data = { ...cause.data, ...data }
				} else {
					this.data = data
				}
				this.name = name
				Object.setPrototypeOf(this, new.target.prototype)
			}
		}

		return ErrorWithData as unknown as new (
			message: string,
			data: D,
			cause?: any,
		) => InstanceType<TBase> & { readonly data: D }
	}

	/**
	 * Extracts all causes from an error recursively, handling cycles and self-references.
	 * @param error - The error to extract causes from
	 * @returns Array of causes in order from immediate to root cause
	 */
	public static readonly extractCauses = (error: BaseError): any[] => {
		const causes: any[] = []
		const visited = new Set<any>()
		let currentError: any = error

		while (
			currentError &&
			currentError.cause !== null &&
			currentError.cause !== undefined
		) {
			// Check for cycles or self-reference
			if (
				visited.has(currentError.cause) ||
				currentError.cause === currentError
			) {
				break
			}

			visited.add(currentError.cause)
			causes.push(currentError.cause)
			currentError = currentError.cause
		}

		return causes
	}

	/**
	 * Parses an error stack trace into structured stack frames.
	 * Handles various formats from Node.js, Chrome, Firefox, Safari, and other browsers.
	 * @param stack - The stack trace string to parse
	 * @returns Array of parsed stack frames
	 */
	public static readonly parseStackTrace = (stack: string): StackFrame[] => {
		if (!stack || typeof stack !== "string") {
			return []
		}

		const lines = stack
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line.length > 0)
		const frames: StackFrame[] = []

		for (const line of lines) {
			// Skip the error message line (first line typically contains the error name and message)
			if (line.includes("Error:") || line.includes("Exception:")) {
				continue
			}

			const frame = Errors.parseStackLine(line)
			if (frame) {
				frames.push(frame)
			}
		}

		return frames
	}

	/**
	 * Parses a single stack trace line into a StackFrame.
	 * @param line - The stack trace line to parse
	 * @returns Parsed StackFrame or null if parsing failed
	 */
	private static readonly parseStackLine = (
		line: string,
	): StackFrame | null => {
		const trimmedLine = line.trim()

		// Try Node.js/V8 format: "at functionName (file:line:column)"
		const v8WithParensMatch = trimmedLine.match(
			/^\s*at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)$/,
		)
		if (v8WithParensMatch) {
			const functionName = v8WithParensMatch[1]
			return {
				functionName:
					functionName === "<anonymous>"
						? null
						: functionName || null,
				fileName: v8WithParensMatch[2] || null,
				lineNumber: v8WithParensMatch[3]
					? parseInt(v8WithParensMatch[3], 10)
					: null,
				columnNumber: v8WithParensMatch[4]
					? parseInt(v8WithParensMatch[4], 10)
					: null,
				raw: trimmedLine,
			}
		}

		// Try Node.js/V8 format without column: "at functionName (file:line)"
		const v8WithParensNoColumnMatch = trimmedLine.match(
			/^\s*at\s+(.+?)\s+\((.+?):(\d+)\)$/,
		)
		if (v8WithParensNoColumnMatch) {
			const functionName = v8WithParensNoColumnMatch[1]
			return {
				functionName:
					functionName === "<anonymous>"
						? null
						: functionName || null,
				fileName: v8WithParensNoColumnMatch[2] || null,
				lineNumber: v8WithParensNoColumnMatch[3]
					? parseInt(v8WithParensNoColumnMatch[3], 10)
					: null,
				columnNumber: null,
				raw: trimmedLine,
			}
		}

		// Try Node.js/V8 format without parentheses: "at file:line:column"
		const v8NoParensMatch = trimmedLine.match(/^\s*at\s+(.+?):(\d+):(\d+)$/)
		if (v8NoParensMatch) {
			return {
				functionName: null,
				fileName: v8NoParensMatch[1] || null,
				lineNumber: v8NoParensMatch[2]
					? parseInt(v8NoParensMatch[2], 10)
					: null,
				columnNumber: v8NoParensMatch[3]
					? parseInt(v8NoParensMatch[3], 10)
					: null,
				raw: trimmedLine,
			}
		}

		// Try Firefox format: "functionName@file:line:column" or "@file:line:column"
		const firefoxMatch = trimmedLine.match(/^([^@]*)@(.+?):(\d+):(\d+)$/)
		if (firefoxMatch) {
			return {
				functionName: firefoxMatch[1] || null,
				fileName: firefoxMatch[2] || null,
				lineNumber: firefoxMatch[3]
					? parseInt(firefoxMatch[3], 10)
					: null,
				columnNumber: firefoxMatch[4]
					? parseInt(firefoxMatch[4], 10)
					: null,
				raw: trimmedLine,
			}
		}

		// Try Firefox format without column: "functionName@file:line" or "@file:line"
		const firefoxNoColumnMatch = trimmedLine.match(/^([^@]*)@(.+?):(\d+)$/)
		if (firefoxNoColumnMatch) {
			return {
				functionName: firefoxNoColumnMatch[1] || null,
				fileName: firefoxNoColumnMatch[2] || null,
				lineNumber: firefoxNoColumnMatch[3]
					? parseInt(firefoxNoColumnMatch[3], 10)
					: null,
				columnNumber: null,
				raw: trimmedLine,
			}
		}

		// Try Safari format: "functionName@file:line:column"
		const safariMatch = trimmedLine.match(/^(.+?)@(.+?)$/)
		if (safariMatch) {
			const functionName = safariMatch[1] || null
			const location = safariMatch[2]

			if (!location) {
				return {
					functionName,
					fileName: null,
					lineNumber: null,
					columnNumber: null,
					raw: trimmedLine,
				}
			}

			// Extract line and column from location
			const locationMatch = location.match(/(.+?):(\d+):(\d+)$/)
			if (locationMatch) {
				return {
					functionName,
					fileName: locationMatch[1] || null,
					lineNumber: locationMatch[2]
						? parseInt(locationMatch[2], 10)
						: null,
					columnNumber: locationMatch[3]
						? parseInt(locationMatch[3], 10)
						: null,
					raw: trimmedLine,
				}
			}

			// Try without column
			const locationNoColumnMatch = location.match(/(.+?):(\d+)$/)
			if (locationNoColumnMatch) {
				return {
					functionName,
					fileName: locationNoColumnMatch[1] || null,
					lineNumber: locationNoColumnMatch[2]
						? parseInt(locationNoColumnMatch[2], 10)
						: null,
					columnNumber: null,
					raw: trimmedLine,
				}
			}

			return {
				functionName,
				fileName: location,
				lineNumber: null,
				columnNumber: null,
				raw: trimmedLine,
			}
		}

		// Try to extract just file:line:column pattern
		const simpleMatch = trimmedLine.match(/^(.+?):(\d+):(\d+)$/)
		if (simpleMatch) {
			return {
				functionName: null,
				fileName: simpleMatch[1] || null,
				lineNumber: simpleMatch[2]
					? parseInt(simpleMatch[2], 10)
					: null,
				columnNumber: simpleMatch[3]
					? parseInt(simpleMatch[3], 10)
					: null,
				raw: trimmedLine,
			}
		}

		// Try to extract just file:line pattern
		const simpleNoColumnMatch = trimmedLine.match(/^(.+?):(\d+)$/)
		if (simpleNoColumnMatch) {
			return {
				functionName: null,
				fileName: simpleNoColumnMatch[1] || null,
				lineNumber: simpleNoColumnMatch[2]
					? parseInt(simpleNoColumnMatch[2], 10)
					: null,
				columnNumber: null,
				raw: trimmedLine,
			}
		}

		// If nothing matches, return the raw line as a fallback
		return {
			functionName: null,
			fileName: null,
			lineNumber: null,
			columnNumber: null,
			raw: trimmedLine,
		}
	}
}
