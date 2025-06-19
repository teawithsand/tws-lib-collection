import {
	atom,
	FormAtomsBuilder,
	FormAtomsDelegateBase,
	FormErrorBag,
} from "@teawithsand/fstate"
import { AppTransString } from "../../../app/trans/defines"

export interface CardFormData {
	globalId: string
	questionContent: string
	answerContent: string
	discoveryPriority: number
}

export class CardFormClass extends FormAtomsDelegateBase<
	CardFormData,
	AppTransString
> {
	public constructor(initialData?: Partial<CardFormData>) {
		const defaultValues: CardFormData = {
			globalId: "",
			questionContent: "",
			answerContent: "",
			discoveryPriority: 0,
			...initialData,
		}

		super(
			FormAtomsBuilder.fromDefaultValues<CardFormData, AppTransString>(
				defaultValues,
			)
				.setFieldValidator("globalId", (fieldValue) => {
					return atom((get) => {
						const globalId = get(fieldValue)
						const errors: AppTransString[] = []

						if (!globalId.trim()) {
							errors.push((trans) =>
								trans.generic.form.thisFieldMustNotBeEmpty(),
							)
						}

						return FormErrorBag.fromArray(errors)
					})
				})
				.setFieldPreSubmitMapper("globalId", (fieldValue) =>
					fieldValue.trim(),
				)
				.setFieldValidator("questionContent", (fieldValue) => {
					return atom((get) => {
						const questionContent = get(fieldValue)
						const errors: AppTransString[] = []

						if (!questionContent.trim()) {
							errors.push((trans) =>
								trans.generic.form.thisFieldMustNotBeEmpty(),
							)
						}

						return FormErrorBag.fromArray(errors)
					})
				})
				.setFieldPreSubmitMapper("questionContent", (fieldValue) =>
					fieldValue.trim(),
				)
				.setFieldValidator("answerContent", (fieldValue) => {
					return atom((get) => {
						const answerContent = get(fieldValue)
						const errors: AppTransString[] = []

						if (!answerContent.trim()) {
							errors.push((trans) =>
								trans.generic.form.thisFieldMustNotBeEmpty(),
							)
						}

						return FormErrorBag.fromArray(errors)
					})
				})
				.setFieldPreSubmitMapper("answerContent", (fieldValue) =>
					fieldValue.trim(),
				)
				.setFieldValidator("discoveryPriority", (fieldValue) => {
					return atom((get) => {
						const discoveryPriority = get(fieldValue)
						const errors: AppTransString[] = []

						if (discoveryPriority < 0) {
							errors.push((trans) =>
								trans.generic.form.discoveryPriorityMustNotBeNegative(),
							)
						}

						return FormErrorBag.fromArray(errors)
					})
				})
				.buildForm(),
		)
	}
}
