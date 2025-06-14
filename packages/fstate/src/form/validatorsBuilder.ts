import { atom } from "jotai"
import { FormGlobalValidator, FormValidator, FormValidators } from "./defines"
import { FormError, FormErrorBag } from "./error"
import { FormDataBase } from "./internal/form"

export class FormValidatorsBuilder<
	T extends FormDataBase,
	E extends FormError = FormError,
> {
	private globalValidators: FormGlobalValidator<T, E>[] = []
	private fieldValidators: Map<keyof T, FormValidator<T, any, E>[]> =
		new Map()

	public static readonly create = <
		T extends FormDataBase,
		E extends FormError = FormError,
	>(): FormValidatorsBuilder<T, E> => {
		return new FormValidatorsBuilder<T, E>()
	}

	public readonly addGlobalValidator = (
		validator: FormGlobalValidator<T, E>,
	): this => {
		this.globalValidators.push(validator)
		return this
	}

	public readonly addFieldValidator = <K extends keyof T>(
		fieldName: K,
		validator: FormValidator<T, K, E>,
	): this => {
		if (!this.fieldValidators.has(fieldName)) {
			this.fieldValidators.set(fieldName, [])
		}
		this.fieldValidators.get(fieldName)!.push(validator)
		return this
	}

	public readonly build = (): FormValidators<T, E> => {
		const result: FormValidators<T, E> = {
			fields: {},
		}

		if (this.globalValidators.length > 0) {
			result.global = (formValue, context) => {
				return atom((get) => {
					const allErrors: E[] = []
					for (const validator of this.globalValidators) {
						const validatorErrors = get(
							validator(formValue, context),
						)
						allErrors.push(...validatorErrors.errors)
					}
					return FormErrorBag.fromArray(allErrors)
				})
			}
		}

		for (const [fieldName, validators] of this.fieldValidators.entries()) {
			const combinedFieldValidator: FormValidator<T, any, E> = (
				fieldValue,
				formValue,
				context,
			) => {
				return atom((get) => {
					const allErrors: E[] = []
					for (const validator of validators) {
						const validatorErrors = get(
							validator(fieldValue, formValue, context),
						)
						allErrors.push(...validatorErrors.errors)
					}
					return FormErrorBag.fromArray(allErrors)
				})
			}
			result.fields[fieldName] = combinedFieldValidator
		}

		return result
	}
}
