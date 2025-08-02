import { AbookData } from "@teawithsand/booklibr"
import { Timestamp } from "@teawithsand/lngext"
import { AbookFormData } from "./abookFormClass"

export class AbookFormUtils {
	private constructor() {}

	/**
	 * Converts AbookData to AbookFormData for form editing
	 */
	public static readonly abookDataToFormData = (
		abookData: AbookData,
	): AbookFormData => ({
		title: abookData.header.metadata.title,
		description: abookData.header.metadata.description,
		privateUserNote: abookData.header.metadata.privateUserNote,
	})

	/**
	 * Converts AbookFormData to AbookData for saving
	 */
	public static readonly formDataToAbookData = (
		formData: AbookFormData,
		existingAbookData?: Partial<AbookData>,
	): AbookData => {
		const now = Timestamp.fromMillis(Date.now())

		return {
			header: {
				createdAt: existingAbookData?.header?.createdAt ?? now,
				metadata: {
					title: formData.title,
					description: formData.description,
					privateUserNote: formData.privateUserNote,
				},
				position: existingAbookData?.header?.position ?? null,
			},
			entries: existingAbookData?.entries ?? new Map(),
		}
	}

	/**
	 * Creates a minimal AbookData with default values
	 */
	public static readonly createDefaultAbookData = (
		formData: AbookFormData,
	): AbookData => {
		return AbookFormUtils.formDataToAbookData(formData)
	}
}
