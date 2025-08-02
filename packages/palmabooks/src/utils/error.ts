import { BaseError, Errors } from "@teawithsand/lngext"

export const PalmabooksError = Errors.makeErrorType(
	"PalmabooksError",
	BaseError,
)
