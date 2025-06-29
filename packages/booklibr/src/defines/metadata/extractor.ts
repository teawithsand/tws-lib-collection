import { BlobMetadata } from "./metadata"

export interface BlobMetadataExtractor {
	extractFromUrl: (url: string) => Promise<BlobMetadata>
	extractFromBlob: (blob: Blob) => Promise<BlobMetadata>
}
