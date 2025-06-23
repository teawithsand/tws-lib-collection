import {
	FsErrorAbort,
	FsErrorAccessDenied,
	FsErrorBadType,
	FsErrorDataClone,
	FsErrorEncoding,
	FsErrorInvalidModification,
	FsErrorInvalidState,
	FsErrorNetwork,
	FsErrorNoModificationAllowed,
	FsErrorNotFound,
	FsErrorQuotaExceeded,
	FsErrorTimeout,
	FsErrorUnknown,
} from "../defines/error"

type ConvertedFsError =
	| InstanceType<typeof FsErrorAccessDenied>
	| InstanceType<typeof FsErrorBadType>
	| InstanceType<typeof FsErrorNotFound>
	| InstanceType<typeof FsErrorQuotaExceeded>
	| InstanceType<typeof FsErrorInvalidModification>
	| InstanceType<typeof FsErrorNoModificationAllowed>
	| InstanceType<typeof FsErrorInvalidState>
	| InstanceType<typeof FsErrorNetwork>
	| InstanceType<typeof FsErrorAbort>
	| InstanceType<typeof FsErrorTimeout>
	| InstanceType<typeof FsErrorEncoding>
	| InstanceType<typeof FsErrorDataClone>
	| InstanceType<typeof FsErrorUnknown>

/**
 * Utility class for converting OPFS (Origin Private File System) errors
 * to application-specific error types.
 */
export class OpfsErrorUtil {
	private constructor() {}

	/**
	 * Converts an OPFS error to an appropriate application error type.
	 * Maps DOMException names and other error types to specific file system errors.
	 *
	 * @param error - The error thrown by OPFS operations
	 * @param context - Optional context string to provide additional error information
	 * @returns The converted error with appropriate type and message
	 */
	public static readonly convertError = (
		error: unknown,
		context?: string,
	): ConvertedFsError => {
		const contextPrefix = context ? `${context}: ` : ""

		// If it's already one of our custom error types, pass it through
		if (error instanceof Error && error.name.startsWith("FsError")) {
			return error as ConvertedFsError
		}

		// Handle DOMException errors (most common OPFS errors)
		if (error instanceof DOMException) {
			const message = `${contextPrefix}${error.message}`

			switch (error.name) {
				case "NotFoundError":
					return new FsErrorNotFound(message, error)

				case "NotAllowedError":
				case "SecurityError":
					return new FsErrorAccessDenied(message, error)

				case "QuotaExceededError":
					return new FsErrorQuotaExceeded(message, error)

				case "InvalidModificationError":
					return new FsErrorInvalidModification(message, error)

				case "NoModificationAllowedError":
					return new FsErrorNoModificationAllowed(message, error)

				case "InvalidStateError":
					return new FsErrorInvalidState(message, error)

				case "TypeMismatchError":
				case "HierarchyRequestError":
					return new FsErrorBadType(message, error)

				case "NetworkError":
					return new FsErrorNetwork(message, error)

				case "AbortError":
					return new FsErrorAbort(message, error)

				case "TimeoutError":
					return new FsErrorTimeout(message, error)

				case "EncodingError":
					return new FsErrorEncoding(message, error)

				case "DataCloneError":
					return new FsErrorDataClone(message, error)

				default:
					return new FsErrorUnknown(
						`${contextPrefix}Unknown DOMException: ${error.name} - ${error.message}`,
						{ cause: error },
					)
			}
		}

		// Handle TypeError (often related to invalid arguments or operations)
		if (error instanceof TypeError) {
			return new FsErrorBadType(
				`${contextPrefix}Type error: ${error.message}`,
				{ cause: error },
			)
		}

		// Handle generic Error instances
		if (error instanceof Error) {
			return new FsErrorUnknown(
				`${contextPrefix}Unexpected error: ${error.message}`,
				{ cause: error },
			)
		}

		// Handle non-Error objects
		const errorMessage = typeof error === "string" ? error : String(error)

		return new FsErrorUnknown(
			`${contextPrefix}Unknown error: ${errorMessage}`,
			{ cause: error },
		)
	}

	/**
	 * Wraps an async OPFS operation with error conversion.
	 * Automatically converts any thrown errors to application error types.
	 *
	 * @param operation - The async operation to execute
	 * @param context - Optional context string for error reporting
	 * @returns Promise that resolves with the operation result or rejects with converted error
	 */
	public static readonly wrapOperation = async <T>(
		operation: () => Promise<T>,
		context?: string,
	): Promise<T> => {
		try {
			return await operation()
		} catch (error) {
			throw OpfsErrorUtil.convertError(error, context)
		}
	}

	/**
	 * Wraps a synchronous OPFS operation with error conversion.
	 * Automatically converts any thrown errors to application error types.
	 *
	 * @param operation - The synchronous operation to execute
	 * @param context - Optional context string for error reporting
	 * @returns The operation result or throws converted error
	 */
	public static readonly wrapSyncOperation = <T>(
		operation: () => T,
		context?: string,
	): T => {
		try {
			return operation()
		} catch (error) {
			throw OpfsErrorUtil.convertError(error, context)
		}
	}
}
