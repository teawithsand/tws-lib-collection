import {
	atom,
	FormAtomsBuilder,
	FormAtomsDelegateBase,
	FormErrorBag,
} from "@teawithsand/fstate"

/**
 * Form data for editing an audiobook's metadata.
 */
export interface AbookEditFormData {
	/** The title of the audiobook */
	title: string
	/** Optional description of the audiobook */
	description: string
	/** Optional private user note */
	privateNote: string
}

/**
 * Simple error type for form validation.
 */
export type AbookEditFormError = string

/**
 * Form class for editing audiobook metadata.
 * Handles validation and data transformation.
 */
export class AbookEditFormClass extends FormAtomsDelegateBase<
	AbookEditFormData,
	AbookEditFormError
> {
	public constructor(initialData?: Partial<AbookEditFormData>) {
		const defaultValues: AbookEditFormData = {
			title: "",
			description: "",
			privateNote: "",
			...initialData,
		}

		super(
			FormAtomsBuilder.fromDefaultValues<
				AbookEditFormData,
				AbookEditFormError
			>(defaultValues)
				.setFieldValidator("title", (fieldValue) => {
					return atom((get) => {
						const title = get(fieldValue)
						const errors: AbookEditFormError[] = []

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
