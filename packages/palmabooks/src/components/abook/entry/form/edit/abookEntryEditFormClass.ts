import { AppTransString } from "@/trans/appTranslation"
import { AbookEntryData, AbookEntryDisposition } from "@teawithsand/booklibr"
import {
	atom,
	FormAtomsBuilder,
	FormAtomsDelegateBase,
	FormErrorBag,
} from "@teawithsand/fstate"

export interface AbookEntryEditFormData {
	name: string
	disposition: AbookEntryDisposition
	ordinalNumber: number
}

export type AbookEntryEditFormInput = AbookEntryEditFormData

export class AbookEntryEditFormClass extends FormAtomsDelegateBase<
	AbookEntryEditFormData,
	AppTransString
> {
	public constructor(initialData?: Partial<AbookEntryEditFormData>) {
		const defaultValues: AbookEntryEditFormData = {
			name: "",
			disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
			ordinalNumber: 1,
			...initialData,
		}

		super(
			FormAtomsBuilder.fromDefaultValues<
				AbookEntryEditFormData,
				AppTransString
			>(defaultValues)
				.setFieldValidator("name", (fieldValue) => {
					return atom((get) => {
						const name = get(fieldValue)
						const errors: AppTransString[] = []

						if (!name.trim()) {
							errors.push(
								(trans) =>
									trans.abooks.form.validation
										.titleMustNotBeEmpty,
							)
						}

						if (name.trim().length > 255) {
							errors.push(
								(trans) =>
									trans.abooks.form.validation.titleTooLong,
							)
						}

						return FormErrorBag.fromArray(errors)
					})
				})
				.setFieldPreSubmitMapper("name", (fieldValue) =>
					fieldValue.trim(),
				)
				.setFieldValidator("ordinalNumber", (fieldValue) => {
					return atom((get) => {
						const ordinalNumber = get(fieldValue)
						const errors: AppTransString[] = []

						if (ordinalNumber < 0) {
							errors.push(
								(trans) => trans.common.error, // Using generic error for now
							)
						}

						return FormErrorBag.fromArray(errors)
					})
				})
				.buildForm(),
		)
	}

	public readonly toAbookEntryData = (
		formData: AbookEntryEditFormInput,
		existingData: AbookEntryData,
	): AbookEntryData => ({
		...existingData,
		name: formData.name,
		disposition: formData.disposition,
		ordinalNumber: formData.ordinalNumber,
	})

	public static readonly fromAbookEntryData = (
		entryData: AbookEntryData,
	): AbookEntryEditFormData => ({
		name: entryData.name,
		disposition: entryData.disposition,
		ordinalNumber: entryData.ordinalNumber,
	})
}
