import { BlobMetadata } from "./metadata"
export interface BlobMetadataExtractor {
	/**
	 * This method should never throw (or reject), as it instead returns error-indicating blob metadata.
	 */
	extractFromUrl: (url: string) => Promise<BlobMetadata>

	/**
	 * This method should never throw (or reject), as it instead returns error-indicating blob metadata.
	 */
	extractFromBlob: (blob: Blob) => Promise<BlobMetadata>
}
