import { AdvancedFileFieldEntry } from "@/components/field/advancedFileField/AdvancedFileField"
import { AppTransString } from "@/trans/appTranslation"
import {
	AbookEntryData,
	AbookEntryDisposition,
	AbookEntrySourceType,
} from "@teawithsand/booklibr"
import { FormAtomsBuilder, FormAtomsDelegateBase } from "@teawithsand/fstate"
import { generateUuid, Timestamp } from "@teawithsand/lngext"

export interface AbookUploadFormData {
	files: AdvancedFileFieldEntry[]
}

export type AbookUploadFormInput = AbookUploadFormData

export class AbookUploadFormClass extends FormAtomsDelegateBase<
	AbookUploadFormData,
	AppTransString
> {
	public constructor(initialData?: Partial<AbookUploadFormData>) {
		const defaultValues: AbookUploadFormData = {
			files: [],
			...initialData,
		}

		super(
			FormAtomsBuilder.fromDefaultValues<
				AbookUploadFormData,
				AppTransString
			>(defaultValues).buildForm(),
		)
	}

	public toAbookEntries(
		formData: AbookUploadFormInput,
		disposition: AbookEntryDisposition,
	): Map<string, AbookEntryData> {
		const entries = new Map<string, AbookEntryData>()
		const now = Timestamp.fromMillis(Date.now())

		for (const selectedFile of formData.files) {
			const entryId = generateUuid()
			const entryData: AbookEntryData = {
				createdAt: now,
				disposition: disposition,
				ordinalNumber: 0,
				source: {
					type: AbookEntrySourceType.UPLOAD,
					uploadedAt: now.toNumberMillis(),
					uploadFileName: selectedFile.file.name,
					uploadFileMime:
						selectedFile.file.type || "application/octet-stream",
				},
			}

			entries.set(entryId, entryData)
		}

		return entries
	}
}
