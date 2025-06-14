import { Draft } from "immer"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { FormAtoms, FormFieldAtoms } from "./defines"
import { FormErrorBag } from "./error"
import { FormDataBase } from "./internal/form"

interface FormField<T> {
	value: T
	set: (value: T | ((draft: Draft<T>) => T | undefined)) => void
	errors: FormErrorBag
	pristine: boolean
	disabled: boolean
}

interface Form<T extends FormDataBase> {
	globalErrors: FormErrorBag
	hasErrors: boolean
	isSubmitting: boolean
	lastSubmitError: any | null
	submit: (callback: (data: T) => Promise<void>) => void
}

export const useForm = <T extends FormDataBase>(
	form: FormAtoms<T>,
): Form<T> => {
	const submit = useSetAtom(form.submit)
	const globalErrors = useAtomValue(form.globalValidationErrors)
	const hasErrors = useAtomValue(form.hasErrors)
	const loadable = useAtomValue(form.submitPromiseLoadable)

	return {
		globalErrors,
		submit,
		hasErrors,
		isSubmitting: loadable.state === "loading",
		lastSubmitError: loadable.state === "hasError" ? loadable.error : null,
	}
}

export const useFormValue = <T extends FormDataBase>(form: FormAtoms<T>): T => {
	return useAtomValue(form.data)
}

export const useFormField = <T>(atoms: FormFieldAtoms<T>): FormField<T> => {
	const [value, setValue] = useAtom(atoms.value)
	const errors = useAtomValue(atoms.validationErrors)
	const pristine = useAtomValue(atoms.pristine)
	const disabled = useAtomValue(atoms.disabled)

	return {
		value: value,
		set: setValue,
		errors,
		pristine,
		disabled,
	}
}
