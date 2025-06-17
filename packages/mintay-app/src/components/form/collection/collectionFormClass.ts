import {
	atom,
	FormAtomsBuilder,
	FormAtomsDelegateBase,
	FormErrorBag,
} from "@teawithsand/fstate"
import { AppTransString } from "../../../app/trans/defines"

export interface CollectionFormData {
	content: string
}

export class CollectionFormClass extends FormAtomsDelegateBase<
	CollectionFormData,
	AppTransString
> {
	public constructor(initialData?: Partial<CollectionFormData>) {
		const defaultValues: CollectionFormData = {
			content: "",
			...initialData,
		}

		super(
			FormAtomsBuilder.fromDefaultValues<
				CollectionFormData,
				AppTransString
			>(defaultValues)
				.setFieldValidator("content", (fieldValue) => {
					return atom((get) => {
						const content = get(fieldValue)
						const errors: AppTransString[] = []

						if (!content.trim()) {
							errors.push((trans) =>
								trans.generic.form.thisFieldMustNotBeEmpty(),
							)
						}

						return FormErrorBag.fromArray(errors)
					})
				})
				.setFieldPreSubmitMapper("content", (fieldValue) =>
					fieldValue.trim(),
				)
				.buildForm(),
		)
	}
}
