import {
	atom,
	FormAtomsBuilder,
	FormAtomsDelegateBase,
	FormErrorBag,
} from "@teawithsand/fstate"
import { AppTransString } from "../../../app/trans/defines"

export interface RegisterFormData {
	username: string
	password: string
	confirmPassword: string
}

export class RegisterFormClass extends FormAtomsDelegateBase<
	RegisterFormData,
	AppTransString
> {
	public constructor(initialData?: Partial<RegisterFormData>) {
		const defaultValues: RegisterFormData = {
			username: "",
			password: "",
			confirmPassword: "",
			...initialData,
		}

		super(
			FormAtomsBuilder.fromDefaultValues<
				RegisterFormData,
				AppTransString
			>(defaultValues)
				.setFieldValidator("username", (fieldValue) => {
					return atom((get) => {
						const username = get(fieldValue)
						const errors: AppTransString[] = []

						if (!username.trim()) {
							errors.push((trans) =>
								trans.generic.form.thisFieldMustNotBeEmpty(),
							)
						}

						return FormErrorBag.fromArray(errors)
					})
				})
				.setFieldPreSubmitMapper("username", (fieldValue) =>
					fieldValue.trim(),
				)
				.setFieldValidator("password", (fieldValue) => {
					return atom((get) => {
						const password = get(fieldValue)
						const errors: AppTransString[] = []

						if (!password) {
							errors.push((trans) =>
								trans.generic.form.thisFieldMustNotBeEmpty(),
							)
						}

						return FormErrorBag.fromArray(errors)
					})
				})
				.setFieldValidator(
					"confirmPassword",
					(fieldValue, formValue) => {
						return atom((get) => {
							const confirmPassword = get(fieldValue)
							const formData = get(formValue)
							const password = formData.password

							const errors: AppTransString[] = []

							if (!confirmPassword) {
								errors.push((trans) =>
									trans.generic.form.thisFieldMustNotBeEmpty(),
								)
							} else if (
								password &&
								confirmPassword !== password
							) {
								errors.push((trans) =>
									trans.auth.register.passwordsDoNotMatch(),
								)
							}

							return FormErrorBag.fromArray(errors)
						})
					},
				)
				.buildForm(),
		)
	}
}
