import { AppTransString } from "@/trans/appTranslation"
import { AbookData } from "@teawithsand/booklibr"
import {
	atom,
	FormAtomsBuilder,
	FormAtomsDelegateBase,
	FormErrorBag,
} from "@teawithsand/fstate"
import { AbookFormUtils } from "./abookFormUtils"

export interface AbookFormData {
	title: string
	description: string
	privateUserNote: string
}

export type AbookFormInput = AbookFormData

export class AbookFormClass extends FormAtomsDelegateBase<
	AbookFormData,
	AppTransString
> {
	public constructor(initialData?: Partial<AbookFormData>) {
		const defaultValues: AbookFormData = {
			title: "",
			description: "",
			privateUserNote: "",
			...initialData,
		}

		super(
			FormAtomsBuilder.fromDefaultValues<AbookFormData, AppTransString>(
				defaultValues,
			)
				.setFieldValidator("title", (fieldValue) => {
					return atom((get) => {
						const title = get(fieldValue)
						const errors: AppTransString[] = []

						if (!title.trim()) {
							errors.push(
								(trans) =>
									trans.abooks.form.validation
										.titleMustNotBeEmpty,
							)
						}

						if (title.trim().length > 200) {
							errors.push(
								(trans) =>
									trans.abooks.form.validation.titleTooLong,
							)
						}

						return FormErrorBag.fromArray(errors)
					})
				})
				.setFieldPreSubmitMapper("title", (fieldValue) =>
					fieldValue.trim(),
				)
				.setFieldValidator("description", (fieldValue) => {
					return atom((get) => {
						const description = get(fieldValue)
						const errors: AppTransString[] = []

						if (description.length > 2000) {
							errors.push(
								(trans) =>
									trans.abooks.form.validation
										.descriptionTooLong,
							)
						}

						return FormErrorBag.fromArray(errors)
					})
				})
				.setFieldPreSubmitMapper("description", (fieldValue) =>
					fieldValue.trim(),
				)
				.setFieldValidator("privateUserNote", (fieldValue) => {
					return atom((get) => {
						const privateUserNote = get(fieldValue)
						const errors: AppTransString[] = []

						if (privateUserNote.length > 1000) {
							errors.push(
								(trans) =>
									trans.abooks.form.validation
										.privateUserNoteTooLong,
							)
						}

						return FormErrorBag.fromArray(errors)
					})
				})
				.setFieldPreSubmitMapper("privateUserNote", (fieldValue) =>
					fieldValue.trim(),
				)
				.buildForm(),
		)
	}

	public toAbookData(formData: AbookFormInput): AbookData {
		return AbookFormUtils.formDataToAbookData(formData)
	}
}
