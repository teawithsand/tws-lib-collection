import {
	atom,
	FormAtomsBuilder,
	FormAtomsDelegateBase,
	FormErrorBag,
} from "@teawithsand/fstate"
import { generateUuid } from "@teawithsand/lngext"
import { AppTransString } from "../../../app/trans/defines"

export interface CardFormData {
	globalId: string
	questionContent: string
	answerContent: string
	discoveryPriority: number
}

export interface CardFormInput {
	questionContent: string
	answerContent: string
	discoveryPriority: number
}

export class CardFormClass extends FormAtomsDelegateBase<
	CardFormInput,
	AppTransString
> {
	public constructor(initialData?: Partial<CardFormInput>) {
		const defaultValues: CardFormInput = {
			questionContent: "",
			answerContent: "",
			discoveryPriority: 0,
			...initialData,
		}

		super(
			FormAtomsBuilder.fromDefaultValues<CardFormInput, AppTransString>(
				defaultValues,
			)
				.setFieldPreSubmitMapper("questionContent", (fieldValue) =>
					fieldValue.trim(),
				)
				.setFieldPreSubmitMapper("answerContent", (fieldValue) =>
					fieldValue.trim(),
				)
				.setFieldValidator("discoveryPriority", (fieldValue) => {
					return atom((get) => {
						const discoveryPriority = get(fieldValue)
						const errors: AppTransString[] = []

						if (!Number.isFinite(discoveryPriority)) {
							errors.push((trans) =>
								trans.generic.form.discoveryPriorityMustBeValidNumber(),
							)
						} else if (!Number.isInteger(discoveryPriority)) {
							errors.push((trans) =>
								trans.generic.form.discoveryPriorityMustBeInteger(),
							)
						}

						return FormErrorBag.fromArray(errors)
					})
				})
				.buildForm(),
		)
	}

	/**
	 * Converts form input data to complete card data by adding a generated UUID
	 */
	public readonly toCardData = (formData: CardFormInput): CardFormData => {
		return {
			...formData,
			globalId: generateUuid(),
		}
	}
}
