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
