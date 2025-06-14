import { Atom, WritableAtom } from "jotai"
import { atomWithImmer } from "jotai-immer"
import { Loadable } from "../jotai"
import { FormError, FormErrorBag } from "./error"
import { FormDataBase } from "./internal/form"

export type FormFieldValueAtom<T> = ReturnType<typeof atomWithImmer<T>>

export type ValidationContext = {
	isSubmitting: Atom<boolean>
}

export type FormValidator<
	T extends FormDataBase,
	K extends keyof T,
	E extends FormError = FormError,
> = (
	fieldValue: Atom<T[K]>,
	formValue: Atom<T>,
	context: ValidationContext,
) => Atom<FormErrorBag<E>>

export type FormDisabledCondition<T extends FormDataBase, K extends keyof T> = (
	fieldValue: Atom<T[K]>,
	formValue: Atom<T>,
	context: ValidationContext,
) => Atom<boolean>

export type FormFieldSpec<T> = {
	value: FormFieldValueAtom<T>
	validation: Atom<FormErrorBag>
}

export type FormFieldsDataAtoms<T extends FormDataBase> = {
	[key in keyof T]: FormFieldValueAtom<T[key]>
}

export type FormFieldsSpecAtoms<T extends FormDataBase> = {
	[key in keyof T]: FormFieldValueAtom<T[key]>
}

export interface FormFieldAtoms<T, E extends FormError> {
	value: FormFieldValueAtom<T>
	disabled: Atom<boolean>
	validationErrors: Atom<FormErrorBag<E>>
	pristine: Atom<boolean>
}

export type FormFieldsAtoms<
	T extends FormDataBase,
	E extends FormError = FormError,
> = {
	[key in keyof T]: FormFieldAtoms<T[key], E>
}

export interface FormAtoms<
	T extends FormDataBase,
	E extends FormError = FormError,
> {
	readonly fields: FormFieldsAtoms<T, E>
	readonly data: Atom<T>
	readonly globalValidationErrors: Atom<FormErrorBag<E>>

	readonly submitPromise: Atom<Promise<void>>
	readonly submitPromiseLoadable: Atom<Loadable<void>>

	readonly hasErrors: Atom<boolean>

	readonly submit: WritableAtom<
		void,
		[callback: (data: T) => Promise<void>],
		Promise<void>
	>
}
