import { inPlace } from "@teawithsand/lngext"
import { atom, Atom } from "jotai"
import { loadable } from "jotai/utils"
import {
	FormAtoms,
	FormFieldAtoms,
	FormFieldsAtoms,
	FormFieldsDataAtoms,
} from "./defines"
import { FormErrorBag } from "./error"
import { FormDataBase } from "./internal/form"
import { FormsAtomsUtil } from "./util"

export class FormAtomsBuilder<T extends FormDataBase> {
	public static readonly fromDefaultValues = <T extends FormDataBase>(
		initialValues: T,
	) => {
		return new FormAtomsBuilder(
			FormsAtomsUtil.getFormFieldsData(initialValues),
		)
	}

	private globalValidationErrors: Atom<FormErrorBag>
	private readonly value
	private readonly fieldValidatorMap: Map<keyof T, Atom<FormErrorBag>>
	private readonly fieldDisabledMap: Map<keyof T, Atom<boolean>>

	private readonly submitPromiseAtom
	private readonly submitPromiseLoadable

	private constructor(private readonly data: FormFieldsDataAtoms<T>) {
		this.value = FormsAtomsUtil.getValue(data)
		this.globalValidationErrors = atom(FormErrorBag.empty())
		this.fieldValidatorMap = new Map()
		this.fieldDisabledMap = new Map()

		this.submitPromiseAtom = atom<Promise<void>>(Promise.resolve())
		this.submitPromiseLoadable = loadable(this.submitPromiseAtom)
	}

	setGlobalValidator = (callback: (value: Atom<T>) => Atom<FormErrorBag>) => {
		this.globalValidationErrors = callback(this.value)
	}

	setFieldValidator = <E extends keyof T>(
		name: E,
		callback: (
			fieldValue: Atom<T[E]>,
			formValue: Atom<T>,
			context: {
				isSubmitting: Atom<boolean>
			},
		) => Atom<FormErrorBag>,
	) => {
		this.fieldValidatorMap.set(
			name,
			callback(this.data[name], this.value, {
				isSubmitting: atom(
					(get) =>
						get(this.submitPromiseLoadable).state === "loading",
				),
			}),
		)
	}

	setFieldDisabledCondition = <E extends keyof T>(
		name: E,
		callback: (
			fieldValue: Atom<T[E]>,
			formValue: Atom<T>,
			context: {
				isSubmitting: Atom<boolean>
			},
		) => Atom<boolean>,
	) => {
		this.fieldDisabledMap.set(
			name,
			callback(this.data[name], this.value, {
				isSubmitting: atom(
					(get) =>
						get(this.submitPromiseLoadable).state === "loading",
				),
			}),
		)
	}

	buildForm = (): FormAtoms<T> => {
		const fields = inPlace(() => {
			const defaultValidator = atom(FormErrorBag.empty())
			const defaultDisabled = atom(
				(get) => get(this.submitPromiseLoadable).state === "loading",
			)
			return Object.fromEntries(
				Object.entries(this.data).map(([k, v]) => {
					const pristine = atom(true)

					const field: FormFieldAtoms<unknown> = {
						value: atom(
							(get) => get(v),
							(get, set, ...args) => {
								const oldValue = get(v)
								set(v, ...args)

								// TODO(teawithsand): customizable equality function
								if (get(v) !== oldValue) {
									set(pristine, false)
								}
							},
						),
						pristine,
						validationErrors:
							this.fieldValidatorMap.get(k) ?? defaultValidator,
						disabled:
							this.fieldDisabledMap.get(k) ?? defaultDisabled,
					}
					return [k, field]
				}),
			) as FormFieldsAtoms<T>
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
			hasErrors: atom((get) => {
				if (!get(this.globalValidationErrors).isEmpty) {
					return true
				}

				for (const vRaw of Object.values(fields)) {
					const v = vRaw as FormFieldAtoms<unknown>
					if (!get(v.validationErrors).isEmpty) {
						return true
					}
				}

				return false
			}),
		}
	}
}
