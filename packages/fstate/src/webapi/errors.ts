import { BaseError, Errors } from "@teawithsand/lngext"

export const WebApiError = Errors.makeErrorType("WebApiError", BaseError)
export const WebApiUnsupportedError = Errors.makeErrorType(
	"WebApiUnsupportedError",
	WebApiError,
)
