import { BaseError, Errors } from "@teawithsand/lngext"

export const FileManagerError = Errors.makeErrorType(
	"FileManagerError",
	BaseError,
)
