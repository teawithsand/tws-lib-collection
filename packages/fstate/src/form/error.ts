export type FormError = unknown

export class FormErrorBagBuilder<E extends FormError = FormError> {
	private readonly errors: E[] = []
	public static readonly empty = <E extends FormError = FormError>() => {
		return new FormErrorBagBuilder<E>()
	}

	private constructor() {}

	addIfThrows = (callback: () => void): this => {
		try {
			callback()
		} catch (e) {
			this.errors.push(e as E)
		}

		return this
	}
	addError = (...errors: E[]): this => {
		this.errors.push(...errors)
		return this
	}
	addErrorTruthy = (...errors: E[]): this => {
		this.errors.push(...errors.filter((e) => !!e))
		return this
	}
	addErrorArray = (errors: E[]): this => {
		this.errors.push(...errors)
		return this
	}
	addErrorArrayTruthy = (errors: E[]): this => {
		this.errors.push(...errors.filter((e) => !!e))
		return this
	}

	build = () => FormErrorBag.fromArray<E>(this.errors)
}

export class FormErrorBag<E extends FormError = FormError> {
	public static readonly empty = <E extends FormError = FormError>() => {
		return FormErrorBag.fromArray<E>([])
	}
	public static readonly fromArray = <E extends FormError = FormError>(
		errors: E[],
	) => {
		return new FormErrorBag<E>(errors)
	}
	private constructor(public readonly errors: E[]) {}

	public static readonly fromCombination = <E extends FormError = FormError>(
		bags: FormErrorBag<E>[],
	): FormErrorBag<E> => {
		let res: E[] = []

		for (const b of bags) {
			res = [...res, ...b.errors]
		}

		return new FormErrorBag<E>(res)
	}

	toArray = (): E[] => {
		return [...this.errors]
	};

	[Symbol.iterator] = () => {
		return this.errors
	}

	get isEmpty() {
		return this.errors.length === 0
	}

	get first(): E | null {
		if (this.errors.length === 0) return null
		return this.errors[0]!
	}
}
