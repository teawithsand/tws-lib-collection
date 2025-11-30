import { TypeAssert } from "@teawithsand/lngext"

export enum AbookEntrySourceType {
	UPLOAD = "upload",
	URL = "url",
}

export type AbookEntrySourceLite =
	| {
			type: AbookEntrySourceType.UPLOAD
	  }
	| {
			type: AbookEntrySourceType.URL
			url: string
	  }

export type AbookEntrySourceFull =
	| {
			type: AbookEntrySourceType.UPLOAD
			uploadedAt: number // TODO(teawithsand): replace this with Timestamp; Fix serialization as well
			uploadFileName: string
			uploadFileMime: string
	  }
	| {
			type: AbookEntrySourceType.URL
			url: string
	  }

export class AbookEntrySourceUtil {
	private constructor() {}

	/**
	 * Converts a full source to a lite source.
	 * @param full - The full source object.
	 * @returns The lite source object.
	 */
	public static readonly toLite = (
		full: AbookEntrySourceFull,
	): AbookEntrySourceLite => {
		switch (full.type) {
			case AbookEntrySourceType.UPLOAD:
				return { type: AbookEntrySourceType.UPLOAD }
			case AbookEntrySourceType.URL:
				return { type: AbookEntrySourceType.URL, url: full.url }
			default:
				TypeAssert.assertNever(full)
				return TypeAssert.unreachable()
		}
	}
}
