import { AbookStoreService } from "@/domain/abookStore/abookStoreService"
import {
	Abook,
	AbookEntryData,
	AbookEntryDisposition,
	AbookEntrySourceType,
	WithId,
} from "@teawithsand/booklibr"
import { atom, loadable } from "@teawithsand/fstate"
import { Timestamp } from "@teawithsand/lngext"
import { ReactContextUtil } from "@teawithsand/mlui"

/**
 * Tabs available in the upload wizard.
 */
export enum AbookEntryUploadTab {
	FILES = "files",
	UPLOAD = "upload",
}

/**
 * Behavior for uploading files as new entries to an existing audiobook.
 */
export class AbookEntryUploadBehavior {
	public readonly activeTab
	public readonly files
	public readonly uploadingPromise
	public readonly uploadingPromiseLoadable
	public readonly isUploading
	public readonly uploadErrors
	public readonly uploadedCount
	public readonly totalSize

	public readonly setActiveTab
	public readonly setFiles
	public readonly removeFile
	public readonly clearFiles
	public readonly startUpload

	private readonly idleUploadingPromise = Promise.resolve()

	public constructor(
		public readonly abook: WithId<Abook>,
		private readonly abookStoreService: AbookStoreService,
		private readonly abookId: string,
		private readonly onUploadFinished?: () => void,
	) {
		this.activeTab = atom<AbookEntryUploadTab>(AbookEntryUploadTab.FILES)
		this.files = atom<File[]>([])
		this.uploadingPromise = atom<Promise<void>>(this.idleUploadingPromise)
		this.uploadingPromiseLoadable = loadable(this.uploadingPromise)
		this.isUploading = atom((get) => {
			const promise = get(this.uploadingPromise)
			if (promise === this.idleUploadingPromise) {
				return false
			}

			const loadableState = get(this.uploadingPromiseLoadable)
			return loadableState.state === "loading"
		})
		this.uploadErrors = atom<Array<{ file: File; error: Error }>>([])
		this.uploadedCount = atom<number>(0)
		this.totalSize = atom((get) => {
			return get(this.files).reduce((sum, file) => sum + file.size, 0)
		})

		this.setActiveTab = atom(
			null,
			(get, set, tabIndex: AbookEntryUploadTab) => {
				if (
					get(this.isUploading) &&
					tabIndex !== AbookEntryUploadTab.UPLOAD
				) {
					return
				}

				set(this.activeTab, tabIndex)
			},
		)

		this.setFiles = atom(null, (get, set, files: File[]) => {
			set(this.files, files)
			set(this.uploadErrors, [])
			set(this.uploadedCount, 0)
			if (files.length === 0 && !get(this.isUploading)) {
				set(this.activeTab, AbookEntryUploadTab.FILES)
			}
		})

		this.removeFile = atom(null, (get, set, index: number) => {
			const files = get(this.files)
			const nextFiles = files.filter((_file, i) => i !== index)
			set(this.files, nextFiles)
			if (nextFiles.length === 0) {
				set(this.uploadErrors, [])
				set(this.uploadedCount, 0)
				if (!get(this.isUploading)) {
					set(this.activeTab, AbookEntryUploadTab.FILES)
				}
			}
		})

		this.clearFiles = atom(null, (get, set) => {
			set(this.files, [])
			set(this.uploadErrors, [])
			set(this.uploadedCount, 0)
			if (!get(this.isUploading)) {
				set(this.activeTab, AbookEntryUploadTab.FILES)
			}
		})

		this.startUpload = atom(null, async (get, set) => {
			const files = get(this.files)
			if (files.length === 0) return

			const uploadPromise = (async () => {
				set(this.activeTab, AbookEntryUploadTab.UPLOAD)
				set(this.uploadErrors, [])
				set(this.uploadedCount, 0)

				const uploadErrors: Array<{ file: File; error: Error }> = []
				let uploadedCount = 0

				try {
					const abookHandle =
						await this.abookStoreService.abookStore.get(this.abookId)
					const existingEntries = await abookHandle.listEntries()
					const baseOrdinal = existingEntries.length

					for (let i = 0; i < files.length; i++) {
						const file = files[i]
						try {
							const entryData = this.createEntryDataFromFile(
								file,
								baseOrdinal + i + 1,
							)
							const entryHandle =
								await abookHandle.createEntry(entryData)

							const blobWriter = await entryHandle.getBlobWriter()
							await blobWriter.write(file)
							await blobWriter.close()
							await entryHandle.computeAggregate()
							uploadedCount++
						} catch (error) {
							uploadErrors.push({
								file,
								error:
									error instanceof Error
										? error
										: new Error(String(error)),
							})
						}
					}

					await abookHandle.computeAggregate()
				} catch (error) {
					const normalizedError =
						error instanceof Error
							? error
							: new Error(String(error))
					for (const file of files) {
						uploadErrors.push({
							file,
							error: normalizedError,
						})
					}
				}

				set(this.uploadErrors, uploadErrors)
				set(this.uploadedCount, uploadedCount)

				if (this.onUploadFinished) {
					this.onUploadFinished()
				}
			})()

			set(this.uploadingPromise, uploadPromise)
			await uploadPromise
			set(this.uploadingPromise, this.idleUploadingPromise)
		})
	}

	private readonly isAudioFile = (file: File): boolean => {
		return file.type.startsWith("audio/")
	}

	private readonly createEntryDataFromFile = (
		file: File,
		ordinalNumber: number,
	): AbookEntryData => {
		const nameFromFile = file.name.replace(/\.[^/.]+$/, "")
		const isAudio = this.isAudioFile(file)

		return {
			createdAt: Timestamp.fromDate(new Date()),
			name: nameFromFile,
			disposition: isAudio
				? AbookEntryDisposition.PLAYABLE_AUDIO
				: AbookEntryDisposition.UNKNOWN,
			source: {
				type: AbookEntrySourceType.UPLOAD,
				uploadedAt: Timestamp.fromDate(new Date()),
				uploadFileName: file.name,
				uploadFileMime: file.type || "application/octet-stream",
			},
			ordinalNumber,
		}
	}
}

export const [AbookEntryUploadBehaviorContext, useAbookEntryUploadBehavior] =
	ReactContextUtil.simpleContext<AbookEntryUploadBehavior>(
		"AbookEntryUploadBehavior",
	)
