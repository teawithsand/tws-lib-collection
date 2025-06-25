/**
 * Utility class for Blob conversions.
 * Provides static methods to convert Blob to ArrayBuffer and text.
 * Uses native Blob methods if available, with fallbacks for compatibility.
 */
export class Blobs {
	private constructor() {}

	/**
	 * Converts a Blob to an ArrayBuffer.
	 * Uses Blob.arrayBuffer() if available, otherwise falls back to FileReader.
	 * @param blob The Blob to convert.
	 * @returns Promise resolving to the ArrayBuffer.
	 */
	public static readonly blobToArrayBuffer = async (
		blob: Blob,
	): Promise<ArrayBuffer> => {
		if (typeof blob.arrayBuffer === "function") {
			return await blob.arrayBuffer()
		}
		// Fallback for environments without Blob.arrayBuffer
		return await new Promise<ArrayBuffer>((resolve, reject) => {
			const reader = new FileReader()
			reader.onload = () => {
				if (reader.result instanceof ArrayBuffer) {
					resolve(reader.result)
				} else {
					reject(new Error("Failed to read Blob as ArrayBuffer"))
				}
			}
			reader.onerror = () =>
				reject(reader.error ?? new Error("Unknown FileReader error"))
			reader.readAsArrayBuffer(blob)
		})
	}

	/**
	 * Converts a Blob to text.
	 * Uses Blob.text() if available, otherwise falls back to FileReader and TextDecoder.
	 * @param blob The Blob to convert.
	 * @returns Promise resolving to the string content.
	 */
	public static readonly blobToText = async (blob: Blob): Promise<string> => {
		if (typeof blob.text === "function") {
			return await blob.text()
		}
		// Fallback for environments without Blob.text
		const buffer = await Blobs.blobToArrayBuffer(blob)
		try {
			const decoder = new TextDecoder()
			return decoder.decode(buffer)
		} catch {
			// Fallback to FileReader if TextDecoder is not available
			return await new Promise<string>((resolve, reject) => {
				const reader = new FileReader()
				reader.onload = () => {
					if (typeof reader.result === "string") {
						resolve(reader.result)
					} else {
						reject(new Error("Failed to read Blob as text"))
					}
				}
				reader.onerror = () =>
					reject(
						reader.error ?? new Error("Unknown FileReader error"),
					)
				reader.readAsText(blob)
			})
		}
	}
}
