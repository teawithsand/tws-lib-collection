import { Errors } from "@teawithsand/lngext"
import { FileManagerError } from "../error"

export const FileManagerOperationError = Errors.makeErrorType(
	"FileManagerOperationError",
	FileManagerError,
)
export const FileManagerOperationInterruptedError = Errors.makeErrorType(
	"FileManagerOperationInterruptedError",
	FileManagerOperationError,
)
