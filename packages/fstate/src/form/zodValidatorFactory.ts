import { Atom, atom } from "jotai"
import { z } from "zod"
import { FormError, FormErrorBag, FormErrorBagBuilder } from "./error"
import { FormDataBase } from "./internal/form"

export interface FormZodErrorConverter<
	T extends FormDataBase,
	E extends FormError,
> {
	readonly convertFieldError: (
		issue: z.ZodIssue,
		fieldName: keyof T,
	) => E | null

	readonly convertGlobalError: (issue: z.ZodIssue) => E | null
}

export type FormZodValidationResult<
	T extends FormDataBase,
	E extends FormError,
> = {
	globalErrors: Atom<FormErrorBag<E>>
	fieldErrors: {
		[k in keyof T]: Atom<FormErrorBag<E>>
	}
}

export class FormZodValidatorFactory<
	T extends FormDataBase,
	E extends FormError,
> {
	private readonly errorConverter: FormZodErrorConverter<T, E>
	private readonly fieldNames: (keyof T)[]

	public constructor({
		errorConverter,
		formData,
	}: {
		errorConverter: FormZodErrorConverter<T, E>
		formData: {
			[k in keyof T]: any
		}
	}) {
		this.errorConverter = errorConverter
		this.fieldNames = formData ? (Object.keys(formData) as (keyof T)[]) : []
	}

	public readonly createValidationResult = (
		schema: z.ZodSchema<T>,
		formDataAtom: Atom<T>,
	): FormZodValidationResult<T, E> => {
		const globalErrors = atom<FormErrorBag<E>>((get) => {
			const data = get(formDataAtom)
			const result = schema.safeParse(data)

			if (result.success) {
				return FormErrorBag.empty<E>()
			}

			const errorBagBuilder = FormErrorBagBuilder.empty<E>()

			for (const issue of result.error.issues) {
				const globalError =
					this.errorConverter.convertGlobalError(issue)
				if (globalError) {
					errorBagBuilder.addError(globalError)
				}
			}

			return errorBagBuilder.build()
		})

		const validationAtom = atom((get) =>
			schema.safeParse(get(formDataAtom)),
		)

		const createFieldErrorAtom = (
			fieldName: keyof T,
		): Atom<FormErrorBag<E>> => {
			return atom<FormErrorBag<E>>((get) => {
				const result = get(validationAtom)

				if (result.success) {
					return FormErrorBag.empty<E>()
				}

				const errorBagBuilder = FormErrorBagBuilder.empty<E>()

				for (const issue of result.error.issues) {
					if (issue.path.length > 0 && issue.path[0] === fieldName) {
						const fieldError =
							this.errorConverter.convertFieldError(
								issue,
								fieldName,
							)
						if (fieldError) {
							errorBagBuilder.addError(fieldError)
						}
					}
				}

				return errorBagBuilder.build()
			})
		}

		const fieldErrors =
			this.fieldNames.length > 0
				? (Object.fromEntries(
						this.fieldNames.map((fieldName) => [
							fieldName,
							createFieldErrorAtom(fieldName),
						]),
					) as { [k in keyof T]: Atom<FormErrorBag<E>> })
				: new Proxy({} as { [k in keyof T]: Atom<FormErrorBag<E>> }, {
						get: (target, prop) => {
							const fieldName = prop as keyof T
							if (!(fieldName in target)) {
								target[fieldName] =
									createFieldErrorAtom(fieldName)
							}
							return target[fieldName]
						},
					})

		return {
			globalErrors,
			fieldErrors,
		}
	}
}
