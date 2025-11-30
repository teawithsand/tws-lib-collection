import {
	AbookEntryDisposition,
	AbookEntrySourceType,
	AbookHandle,
} from "@teawithsand/booklibr"
import { atom, loadable } from "@teawithsand/fstate"
import { inPlace, Timestamp } from "@teawithsand/lngext"
import { AbookAddFilesWizardEntry } from "."

export type AbookAddFilesWizardUploadProgress = {
	totalFiles: number
	processedFiles: number
	currentFile: AbookAddFilesWizardEntry | null
	error: unknown | null
}

/**
 * Handles uploading wizard entries to a given abook handle while exposing progress atoms.
 */
export class AbookAddFilesWizardUpload {
	public readonly startUpload
	public readonly uploadingPromise
	public readonly uploadingPromiseLoadable

	public readonly uploadingProgress

	constructor() {
		const innerUploadPromise = atom<Promise<void>>(Promise.resolve())

		this.uploadingPromise = atom((get) => get(innerUploadPromise))
		this.uploadingPromiseLoadable = loadable(this.uploadingPromise)

		const innerUploadingProgress =
			atom<AbookAddFilesWizardUploadProgress | null>(null)
		this.uploadingProgress = atom((get) => get(innerUploadingProgress))

		this.startUpload = atom(
			null,
			(
				_get,
				set,
				handle: AbookHandle,
				files: AbookAddFilesWizardEntry[],
			) => {
				const promise = inPlace(async () => {
					const uploadStartedAt = new Date()
					const totalFiles = files.length
					set(innerUploadingProgress, {
						totalFiles,
						processedFiles: 0,
						currentFile: null,
						error: null,
					})
					let processedFiles = 0
					try {
						for (const file of files) {
							set(innerUploadingProgress, {
								totalFiles,
								processedFiles,
								currentFile: file,
								error: null,
							})
							const entry = await handle.createEntry({
								name: file.fileName,
								createdAt: Timestamp.fromDate(uploadStartedAt),
								disposition: AbookEntryDisposition.UNKNOWN,
								ordinalNumber: 0,
								source: {
									type: AbookEntrySourceType.UPLOAD,
									uploadedAt:
										Timestamp.fromDate(uploadStartedAt),
									uploadFileMime: file.file.type,
									uploadFileName: file.originalFileName,
								},
							})
							const writer = await entry.getBlobWriter()
							try {
								await writer.write(file.file)
							} finally {
								await writer.close()
							}

							processedFiles += 1
							set(innerUploadingProgress, {
								totalFiles,
								processedFiles,
								currentFile: null,
								error: null,
							})
						}
						set(innerUploadingProgress, {
							totalFiles,
							processedFiles,
							currentFile: null,
							error: null,
						})
					} catch (error) {
						set(innerUploadingProgress, {
							totalFiles,
							processedFiles,
							currentFile: null,
							error,
						})
						throw error
					}
				})

				set(innerUploadPromise, promise)

				return promise
			},
		)
	}
}
