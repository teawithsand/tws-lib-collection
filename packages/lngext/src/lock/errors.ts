import { BaseError, Errors } from "../error"

/**
 * Base error class for all lock-related errors.
 * This serves as the parent class for all lock operation failures.
 */
export const LockError = Errors.makeErrorType("LockError", BaseError)

/**
 * Error thrown when attempting to perform an operation on a lock that is already held.
 */
export const LockAlreadyHeldError = Errors.makeErrorType(
	"LockAlreadyHeldError",
	LockError,
)

/**
 * Error thrown when attempting to unlock a lock that is not currently held.
 */
export const LockNotHeldError = Errors.makeErrorType(
	"LockNotHeldError",
	LockError,
)

/**
 * Error thrown when attempting to unlock a read lock that is not currently held.
 */
export const ReadLockNotHeldError = Errors.makeErrorType(
	"ReadLockNotHeldError",
	LockError,
)

/**
 * Error thrown when attempting to unlock a write lock that is not currently held.
 */
export const WriteLockNotHeldError = Errors.makeErrorType(
	"WriteLockNotHeldError",
	LockError,
)
