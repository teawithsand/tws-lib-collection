import {
	atom,
	FormAtomsBuilder,
	FormAtomsDelegateBase,
	FormErrorBag,
} from "@teawithsand/fstate"
import { AppTransString } from "../../app/trans/defines"

export interface CollectionFormData {
	title: string
	description: string
}

export class CollectionFormClass extends FormAtomsDelegateBase<
	CollectionFormData,
	AppTransString
> {
	public constructor(initialData?: Partial<CollectionFormData>) {
		const defaultValues: CollectionFormData = {
			title: "",
			description: "",
			...initialData,
		}

		super(
			FormAtomsBuilder.fromDefaultValues<
				CollectionFormData,
				AppTransString
			>(defaultValues)
				.setFieldValidator("title", (fieldValue) => {
					return atom((get) => {
						const title = get(fieldValue)
						const errors: AppTransString[] = []

						if (!title.trim()) {
							errors.push((trans) =>
								trans.generic.form.thisFieldMustNotBeEmpty(),
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

						if (!description.trim()) {
							errors.push((trans) =>
								trans.generic.form.thisFieldMustNotBeEmpty(),
							)
						}

						return FormErrorBag.fromArray(errors)
					})
				})
				.setFieldPreSubmitMapper("description", (fieldValue) =>
					fieldValue.trim(),
				)
				.buildForm(),
		)
	}
}
