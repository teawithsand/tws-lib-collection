import { Atom, WritableAtom } from "jotai"
import { atomWithImmer } from "jotai-immer"
import { Loadable } from "../jotai"
import { FormErrorBag } from "./error"
import { FormDataBase } from "./internal/form"

export type FormFieldValueAtom<T> = ReturnType<typeof atomWithImmer<T>>

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

export interface FormFieldAtoms<T> {
	value: FormFieldValueAtom<T>
	disabled: Atom<boolean>
	validationErrors: Atom<FormErrorBag>
	pristine: Atom<boolean>
}

export type FormFieldsAtoms<T extends FormDataBase> = {
	[key in keyof T]: FormFieldAtoms<T[key]>
}

export interface FormAtoms<T extends FormDataBase> {
	readonly fields: FormFieldsAtoms<T>
	readonly data: Atom<T>
	readonly globalValidationErrors: Atom<FormErrorBag>

	readonly submitPromise: Atom<Promise<void>>
	readonly submitPromiseLoadable: Atom<Loadable<void>>

	readonly hasErrors: Atom<boolean>

	readonly submit: WritableAtom<
		void,
		[callback: (data: T) => Promise<void>],
		Promise<void>
	>
}
