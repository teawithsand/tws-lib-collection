import { Errors } from "@teawithsand/lngext"
import { FileManagerOperationError } from "../error"

export const FileManagerRemoveOperationError = Errors.makeErrorType(
	"FileManagerRemoveOperationError",
	FileManagerOperationError,
)
