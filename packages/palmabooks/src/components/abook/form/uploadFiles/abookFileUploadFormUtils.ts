import { SelectedFile } from "@/components/field"
import {
	AbookEntryData,
	AbookEntryDisposition,
	AbookEntrySourceType,
} from "@teawithsand/booklibr"
import { Timestamp } from "@teawithsand/lngext"
import { AbookFileUploadFormData } from "./abookFileUploadFormClass"

export class AbookFileUploadFormUtils {
	private constructor() {}

	/**
	 * Converts uploaded files to AbookEntryData array
	 */
	public static readonly filesToEntryData = (
		files: SelectedFile[],
		disposition: AbookEntryDisposition,
	): AbookEntryData[] => {
		const now = Timestamp.fromMillis(Date.now())

		return files.map((uploadedFile) => {
			const file = uploadedFile.file

			return {
				createdAt: now,
				disposition: disposition,
				source: {
					type: AbookEntrySourceType.UPLOAD,
					uploadedAt: Date.now(),
					uploadFileName: file.name,
					uploadFileMime: file.type || "application/octet-stream",
				},
			}
		})
	}

	/**
	 * Creates initial form data
	 */
	public static readonly createInitialFormData =
		(): AbookFileUploadFormData => ({
			files: [],
			defaultDisposition: AbookEntryDisposition.PLAYABLE_AUDIO,
		})

	/**
	 * Validates if form data is ready for upload
	 */
	public static readonly isReadyForUpload = (
		formData: AbookFileUploadFormData,
	): boolean => {
		return formData.files.length > 0
	}
}
