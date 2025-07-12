import { BaseError, Errors } from "@teawithsand/lngext"

/**
 * Base class for all blob metadata extraction errors.
 */
export const BlobMetadataExtractionError = Errors.makeErrorType(
	"BlobMetadataExtractionError",
	BaseError,
)

// Specific error types for blob metadata extraction
export const BlobMetadataExtractionTimeoutError = Errors.makeErrorType(
	"BlobMetadataExtractionTimeoutError",
	BlobMetadataExtractionError,
)

export const ImageLoadError = Errors.makeErrorType(
	"ImageLoadError",
	BlobMetadataExtractionError,
)

export const AudioDurationExtractionError = Errors.makeErrorType(
	"AudioDurationExtractionError",
	BlobMetadataExtractionError,
)

export const InvalidAudioDurationError = Errors.makeErrorType(
	"InvalidAudioDurationError",
	BlobMetadataExtractionError,
)
