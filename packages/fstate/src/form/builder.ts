import { inPlace } from "@teawithsand/lngext"
import { atom, Atom, WritableAtom } from "jotai"
import { loadable } from "jotai/utils"
import {
	FormAtoms,
	FormDisabledCondition,
	FormFieldAtoms,
	FormFieldsAtoms,
	FormFieldsDataAtoms,
	FormFieldValueAtom,
	FormValidator,
	FormValidators,
	ValidationContext,
} from "./defines"
import { FormError, FormErrorBag } from "./error"
import { FormDataBase } from "./internal/form"
import { FormsAtomsUtil } from "./util"

export class FormAtomsBuilder<
	T extends FormDataBase,
	E extends FormError = FormError,
> {
	public static readonly fromDefaultValues = <T extends FormDataBase>(
		initialValues: T,
	) => {
		return new FormAtomsBuilder(
			FormsAtomsUtil.getFormFieldsData(initialValues),
		)
	}

	private globalValidationErrors: Atom<FormErrorBag<E>>
	private readonly value
	private readonly fieldValidatorMap: Map<keyof T, Atom<FormErrorBag<E>>>
	private readonly fieldDisabledMap: Map<keyof T, Atom<boolean>>
	private readonly submitPromiseAtom
	private readonly submitPromiseLoadable

	private constructor(private readonly data: FormFieldsDataAtoms<T>) {
		this.value = FormsAtomsUtil.getValue(data)
		this.globalValidationErrors = atom(FormErrorBag.empty<E>())
		this.fieldValidatorMap = new Map()
		this.fieldDisabledMap = new Map()

		this.submitPromiseAtom = atom<Promise<void>>(Promise.resolve())
		this.submitPromiseLoadable = loadable(this.submitPromiseAtom)
	}

	private readonly createValidationContext = (): ValidationContext => {
		return {
			isSubmitting: atom(
				(get) => get(this.submitPromiseLoadable).state === "loading",
			),
		}
	}

	public readonly setFormValidators = (
		validatorsBuilder: (context: {
			formData: Atom<T>
			validationContext: ValidationContext
		}) => FormValidators<T, E>,
	): this => {
		const validators = validatorsBuilder({
			formData: this.value,
			validationContext: this.createValidationContext(),
		})

		if (validators.global) {
			this.globalValidationErrors = validators.global(
				this.value,
				this.createValidationContext(),
			)
		} else {
			this.globalValidationErrors = atom(FormErrorBag.empty<E>())
		}

		this.fieldValidatorMap.clear()

		for (const [fieldName, validator] of Object.entries(
			validators.fields,
		)) {
			if (validator) {
				this.fieldValidatorMap.set(
					fieldName as keyof T,
					validator(
						this.data[fieldName as keyof T],
						this.value,
						this.createValidationContext(),
					),
				)
			}
		}

		return this
	}

	public readonly setGlobalValidator = (
		validator: (value: Atom<T>) => Atom<FormErrorBag<E>>,
	): this => {
		this.globalValidationErrors = validator(this.value)
		return this
	}

	public readonly setFieldValidator = <K extends keyof T>(
		name: K,
		validator: FormValidator<T, K, E>,
	): this => {
		this.fieldValidatorMap.set(
			name,
			validator(
				this.data[name],
				this.value,
				this.createValidationContext(),
			),
		)
		return this
	}

	public readonly setFieldDisabledCondition = <K extends keyof T>(
		name: K,
		condition: FormDisabledCondition<T, K>,
	): this => {
		this.fieldDisabledMap.set(
			name,
			condition(
				this.data[name],
				this.value,
				this.createValidationContext(),
			),
		)
		return this
	}

	private readonly createDefaultAtoms = () => {
		return {
			validator: atom(FormErrorBag.empty<E>()),
			disabled: atom(
				(get) => get(this.submitPromiseLoadable).state === "loading",
			),
		}
	}

	private readonly createHasErrorsAtom = (fields: FormFieldsAtoms<T, E>) => {
		return atom((get) => {
			if (!get(this.globalValidationErrors).isEmpty) {
				return true
			}

			for (const fieldAtoms of Object.values(fields)) {
				const field = fieldAtoms as FormFieldAtoms<unknown, E>
				if (!get(field.validationErrors).isEmpty) {
					return true
				}
			}

			return false
		})
	}

	private readonly createFieldAtom = <K extends keyof T>(
		fieldValueAtom: FormFieldValueAtom<T[K]>,
		fieldKey: K,
		pristineAtom: WritableAtom<boolean, [boolean], void>,
		defaultValidator: Atom<FormErrorBag<E>>,
		defaultDisabled: Atom<boolean>,
	): FormFieldAtoms<T[K], E> => {
		return {
			value: atom(
				(get) => get(fieldValueAtom),
				(get, set, ...args) => {
					const oldValue = get(fieldValueAtom)
					set(fieldValueAtom, ...args)

					// TODO(teawithsand): customizable equality function
					if (get(fieldValueAtom) !== oldValue) {
						set(pristineAtom, false)
					}
				},
			),
			pristine: pristineAtom,
			validationErrors:
				this.fieldValidatorMap.get(fieldKey) ?? defaultValidator,
			disabled: this.fieldDisabledMap.get(fieldKey) ?? defaultDisabled,
		}
	}

	buildForm = (): FormAtoms<T, E> => {
		const defaultAtoms = this.createDefaultAtoms()

		const fields = inPlace(() => {
			return Object.fromEntries(
				Object.entries(this.data).map(([k, v]) => {
					const pristine = atom(true)
					const field = this.createFieldAtom(
						v as FormFieldValueAtom<any>, // TypeScript cannot infer the exact type from Object.entries(), but we know v is FormFieldValueAtom<T[K]>
						k as keyof T,
						pristine,
						defaultAtoms.validator,
						defaultAtoms.disabled,
					)
					return [k, field]
				}),
			) as unknown as FormFieldsAtoms<T, E>
		})

		return {
			fields,
			data: this.value,
			globalValidationErrors: this.globalValidationErrors,
			submit: atom(null, (get, set, callback) => {
				const promise = inPlace(
					async () => await callback(get(this.value)),
				)
				set(this.submitPromiseAtom, promise)
				promise.catch(() => {})
				return promise
			}),
			submitPromise: this.submitPromiseAtom,
			submitPromiseLoadable: this.submitPromiseLoadable,
			hasErrors: this.createHasErrorsAtom(fields),
		}
	}
}
