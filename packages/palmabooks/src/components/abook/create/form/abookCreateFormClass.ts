import {
	atom,
	FormAtomsBuilder,
	FormAtomsDelegateBase,
	FormErrorBag,
} from "@teawithsand/fstate"

/**
 * Form data for creating an audiobook.
 */
export interface AbookCreateFormData {
	/** The title of the audiobook */
	title: string
	/** Optional description of the audiobook */
	description: string
	/** Optional private user note */
	privateNote: string
	/** Files to be uploaded (audio files, cover images, etc.) */
	files: File[]
}

/**
 * Simple error type for form validation.
 * We use strings for simplicity, but this could be a more complex type.
 */
export type AbookCreateFormError = string

/**
 * Form class for creating audiobooks.
 * Handles validation and data transformation.
 */
export class AbookCreateFormClass extends FormAtomsDelegateBase<
	AbookCreateFormData,
	AbookCreateFormError
> {
	public constructor(initialData?: Partial<AbookCreateFormData>) {
		const defaultValues: AbookCreateFormData = {
			title: "",
			description: "",
			privateNote: "",
			files: [],
			...initialData,
		}

		super(
			FormAtomsBuilder.fromDefaultValues<
				AbookCreateFormData,
				AbookCreateFormError
			>(defaultValues)
				.setFieldValidator("title", (fieldValue) => {
					return atom((get) => {
						const title = get(fieldValue)
						const errors: AbookCreateFormError[] = []

						if (!title.trim()) {
							errors.push("Title must not be empty")
						}

						if (title.length > 200) {
							errors.push("Title must not exceed 200 characters")
						}

						return FormErrorBag.fromArray(errors)
					})
				})
				.setFieldPreSubmitMapper("title", (fieldValue) =>
					fieldValue.trim(),
				)
				.setFieldPreSubmitMapper("description", (fieldValue) =>
					fieldValue.trim(),
				)
				.setFieldPreSubmitMapper("privateNote", (fieldValue) =>
					fieldValue.trim(),
				)
				.buildForm(),
		)
	}
}
