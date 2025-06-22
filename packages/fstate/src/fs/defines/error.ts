import { BaseError, Errors } from "@teawithsand/lngext"

export const FsError = Errors.makeErrorType("FsError", BaseError)
export const FsErrorBadType = Errors.makeErrorType("FsErrorBadType", FsError)
export const FsErrorAccessDenied = Errors.makeErrorType(
	"FsErrorAccessDenied",
	FsError,
)
