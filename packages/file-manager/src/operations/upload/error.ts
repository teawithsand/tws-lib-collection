import { Errors } from "@teawithsand/lngext"
import { FileManagerOperationError } from "../error"

export const FileManagerUploadOperationError = Errors.makeErrorType(
	"FileManagerUploadOperationError",
	FileManagerOperationError,
)
