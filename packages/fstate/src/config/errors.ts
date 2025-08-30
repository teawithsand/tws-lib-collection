import { BaseError, Errors } from "@teawithsand/lngext"

export const ConfigError = Errors.makeErrorType("ConfigError", BaseError)

export const ConfigFieldLoadError = Errors.makeErrorType(
	"ConfigFieldLoadError",
	ConfigError,
)

export const ConfigFieldStoreError = Errors.makeErrorType(
	"ConfigFieldStoreError",
	ConfigError,
)

export const ConfigFieldMismatchError = Errors.makeErrorType(
	"ConfigFieldMismatchError",
	ConfigError,
)

export const ConfigUnknownFieldError = Errors.makeErrorType(
	"ConfigUnknownFieldError",
	ConfigFieldMismatchError,
)
