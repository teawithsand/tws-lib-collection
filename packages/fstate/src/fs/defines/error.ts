import { BaseError, Errors } from "@teawithsand/lngext"

export const FsError = Errors.makeErrorType("FsError", BaseError)
export const FsErrorBadType = Errors.makeErrorType("FsErrorBadType", FsError)
export const FsErrorAccessDenied = Errors.makeErrorType(
	"FsErrorAccessDenied",
	FsError,
)
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

export const FsErrorSecurity = Errors.makeErrorType("FsErrorSecurity", FsError)

export const FsErrorNetwork = Errors.makeErrorType("FsErrorNetwork", FsError)

export const FsErrorAbort = Errors.makeErrorType("FsErrorAbort", FsError)

export const FsErrorTimeout = Errors.makeErrorType("FsErrorTimeout", FsError)

export const FsErrorEncoding = Errors.makeErrorType("FsErrorEncoding", FsError)

export const FsErrorDataClone = Errors.makeErrorType(
	"FsErrorDataClone",
	FsError,
)

export const FsErrorUnknown = Errors.makeErrorType("FsErrorUnknown", FsError)
