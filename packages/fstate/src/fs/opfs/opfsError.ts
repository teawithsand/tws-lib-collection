import {
	FsErrorAccessDenied,
	FsErrorAlreadyExists,
	FsErrorBadType,
	FsErrorInvalidModification,
	FsErrorInvalidState,
	FsErrorNoModificationAllowed,
	FsErrorNotFound,
	FsErrorQuotaExceeded,
	FsErrorUnknown,
} from "../defines"

/**
 * Utility class for mapping OPFS/DOM errors to FsError types.
 */
export class OpfsErrorUtil {
	/**
	 * Checks if the error is a NotFoundError DOMException.
	 */
	public static readonly isNotFoundError = (e: unknown): boolean => {
		return e instanceof DOMException && e.name === "NotFoundError"
	}

	/**
	 * Converts a DOMException or unknown error to a specific FsError type.
	 * @param e The error to convert
	 * @param msg The error message
	 * @returns An FsError instance
	 */
	public static readonly convertToFsError = (
		e: unknown,
		msg: string,
	): Error => {
		if (e instanceof DOMException) {
			switch (e.name) {
				case "TypeMismatchError":
					return new FsErrorBadType(msg, e)
				case "NotFoundError":
					return new FsErrorNotFound(msg, e)
				case "SecurityError":
				case "NoModificationAllowedError":
					return new FsErrorNoModificationAllowed(msg, e)
				case "InvalidModificationError":
					return new FsErrorInvalidModification(msg, e)
				case "QuotaExceededError":
					return new FsErrorQuotaExceeded(msg, e)
				case "InvalidStateError":
					return new FsErrorInvalidState(msg, e)
				case "NotAllowedError":
				case "SecurityError":
					return new FsErrorAccessDenied(msg, e)
				case "ConstraintError":
					return new FsErrorAlreadyExists(msg, e)
				default:
					return new FsErrorUnknown(msg, e)
			}
		}
		return new FsErrorUnknown(msg, e)
	}
}
