import {
	atom,
	FormAtomsBuilder,
	FormAtomsDelegateBase,
	FormErrorBag,
} from "@teawithsand/fstate"
import { AppTransString } from "../../../app/trans/defines"

export interface LoginFormData {
	username: string
	password: string
}

export class LoginFormClass extends FormAtomsDelegateBase<
	LoginFormData,
	AppTransString
> {
	public constructor(initialData?: Partial<LoginFormData>) {
		const defaultValues: LoginFormData = {
			username: "",
			password: "",
			...initialData,
		}

		super(
			FormAtomsBuilder.fromDefaultValues<LoginFormData, AppTransString>(
				defaultValues,
			)
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
				.buildForm(),
		)
	}
}
