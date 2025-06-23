import { BaseError, Errors } from "@teawithsand/lngext"

export const FsError = Errors.makeErrorType("FsError", BaseError)
export const FsErrorBadType = Errors.makeErrorType("FsErrorBadType", FsError)
export const FsErrorAccessDenied = Errors.makeErrorType(
	"FsErrorAccessDenied",
	FsError,
)
export const FsErrorBadPath = Errors.makeErrorType("FsErrorBadPath", FsError)
export const FsErrorNotFound = Errors.makeErrorType("FsErrorNotFound", FsError)

export const FsErrorAlreadyExists = Errors.makeErrorType(
	"FsErrorAlreadyExists",
	FsError,
)

export const FsErrorQuotaExceeded = Errors.makeErrorType(
	"FsErrorQuotaExceeded",
	FsError,
)

export const FsErrorInvalidModification = Errors.makeErrorType(
	"FsErrorInvalidModification",
	FsError,
)

export const FsErrorNoModificationAllowed = Errors.makeErrorType(
	"FsErrorNoModificationAllowed",
	FsError,
)

export const FsErrorInvalidState = Errors.makeErrorType(
	"FsErrorInvalidState",
	FsError,
)

export const FsErrorUnknown = Errors.makeErrorType("FsErrorUnknown", FsError)
