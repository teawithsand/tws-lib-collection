import { UploadedFile } from "@/components/field/fileUpload/FileUploadField"
import { AppTransString } from "@/trans/appTranslation"
import { AbookEntryDisposition } from "@teawithsand/booklibr"
import {
	atom,
	FormAtomsBuilder,
	FormAtomsDelegateBase,
	FormErrorBag,
} from "@teawithsand/fstate"

export interface AbookFileUploadFormData {
	files: UploadedFile[]
	defaultDisposition: AbookEntryDisposition
}

export type AbookFileUploadFormInput = AbookFileUploadFormData

const AUDIO_TYPES = [
	"audio/mpeg",
	"audio/mp3",
	"audio/wav",
	"audio/mp4",
	"audio/aac",
	"audio/ogg",
	"audio/webm",
	"audio/flac",
]

const IMAGE_TYPES = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/bmp",
]

export class AbookFileUploadFormClass extends FormAtomsDelegateBase<
	AbookFileUploadFormData,
	AppTransString
> {
	public constructor(initialData?: Partial<AbookFileUploadFormData>) {
		const defaultValues: AbookFileUploadFormData = {
			files: [],
			defaultDisposition: AbookEntryDisposition.PLAYABLE_AUDIO,
			...initialData,
		}

		super(
			FormAtomsBuilder.fromDefaultValues<
				AbookFileUploadFormData,
				AppTransString
			>(defaultValues)
				.setFieldValidator("files", (fieldValue) => {
					return atom((get) => {
						const files = get(fieldValue)
						const errors: AppTransString[] = []

						if (files.length === 0) {
							errors.push((trans) => trans.fileUpload.placeholder)
						}

						return FormErrorBag.fromArray(errors)
					})
				})
				.buildForm(),
		)
	}

	/**
	 * Determines the disposition for a file based on its MIME type
	 */
	public readonly determineDisposition = (
		file: File,
	): AbookEntryDisposition => {
		if (AUDIO_TYPES.includes(file.type)) {
			return AbookEntryDisposition.PLAYABLE_AUDIO
		}
		if (IMAGE_TYPES.includes(file.type)) {
			return AbookEntryDisposition.COVER_IMAGE
		}
		// Default to PLAYABLE_AUDIO for unknown file types
		return AbookEntryDisposition.PLAYABLE_AUDIO
	}

	/**
	 * Gets file type counts for display purposes
	 */
	public readonly getFileTypeCounts = (files: UploadedFile[]) => {
		const audioFiles = files.filter((f) =>
			AUDIO_TYPES.includes(f.file.type),
		)
		const imageFiles = files.filter((f) =>
			IMAGE_TYPES.includes(f.file.type),
		)
		const otherFiles = files.filter(
			(f) =>
				!AUDIO_TYPES.includes(f.file.type) &&
				!IMAGE_TYPES.includes(f.file.type),
		)

		return {
			audio: audioFiles.length,
			image: imageFiles.length,
			other: otherFiles.length,
			total: files.length,
		}
	}
}
