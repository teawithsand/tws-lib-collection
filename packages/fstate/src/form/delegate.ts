import { Atom, WritableAtom } from "jotai"
import { Loadable } from "../jotai"
import { FormAtoms, FormFieldsAtoms } from "./defines"
import { FormError, FormErrorBag } from "./error"
import { FormDataBase } from "./internal/form"

export abstract class FormAtomsDelegateBase<
	T extends FormDataBase,
	E extends FormError = FormError,
> implements FormAtoms<T, E>
{
	public readonly fields: FormFieldsAtoms<T>
	public readonly data: Atom<T>
	public readonly globalValidationErrors: Atom<FormErrorBag<E>>
	public readonly submitPromise: Atom<Promise<void>>
	public readonly submitPromiseLoadable: Atom<Loadable<void>>
	public readonly submit: WritableAtom<
		void,
		[callback: (data: T) => Promise<void>],
		Promise<void>
	>
	public readonly hasErrors: Atom<boolean>

	protected constructor(formAtoms: FormAtoms<T, E>) {
		this.fields = formAtoms.fields
		this.data = formAtoms.data
		this.globalValidationErrors = formAtoms.globalValidationErrors
		this.submitPromise = formAtoms.submitPromise
		this.submitPromiseLoadable = formAtoms.submitPromiseLoadable
		this.submit = formAtoms.submit
		this.hasErrors = formAtoms.hasErrors
	}
}
