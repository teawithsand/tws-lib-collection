import { Errors } from "@teawithsand/lngext"
import { FileManagerOperationError } from "../error"

export const FileManagerCopyOperationError = Errors.makeErrorType(
	"FileManagerCopyOperationError",
	FileManagerOperationError,
)

export const FileManagerCopyConflictError = Errors.makeErrorType(
	"FileManagerCopyConflictError",
	FileManagerCopyOperationError,
)
