import { BaseError, Errors } from "@teawithsand/lngext"

export const AbookError = Errors.makeErrorType("AbookError", BaseError)
export const AbookNotFoundError = Errors.makeErrorType(
	"AbookNotFoundError",
	AbookError,
)
export const AbookEntryNotFoundError = Errors.makeErrorType(
	"AbookEntryNotFoundError",
	AbookError,
)
export const AbookEntryBlobNotFoundError = Errors.makeErrorType(
	"AbookEntryBlobNotFoundError",
	AbookEntryNotFoundError,
)
