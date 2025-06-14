export type FormError = any

export class FormErrorBagBuilder {
	private readonly errors: FormError[] = []
	public static readonly empty = () => {
		return new FormErrorBagBuilder()
	}

	private constructor() {}

	addIfThrows = (callback: () => void): this => {
		try {
			callback()
		} catch (e) {
			this.errors.push(e)
		}

		return this
	}
	addError = (...errors: FormError[]): this => {
		this.errors.push(...errors)
		return this
	}
	addErrorTruthy = (...errors: FormError[]): this => {
		this.errors.push(...errors.filter((e) => !!e))
		return this
	}
	addErrorArray = (errors: FormError[]): this => {
		this.errors.push(...errors)
		return this
	}
	addErrorArrayTruthy = (errors: FormError[]): this => {
		this.errors.push(...errors.filter((e) => !!e))
		return this
	}

	build = () => FormErrorBag.fromArray(this.errors)
}

export class FormErrorBag {
	public static readonly empty = () => {
		return FormErrorBag.fromArray([])
	}
	public static readonly fromArray = (errors: FormError[]) => {
		return new FormErrorBag(errors)
	}
	private constructor(public readonly errors: FormError[]) {}

	public static readonly fromCombination = (
		bags: FormErrorBag[],
	): FormErrorBag => {
		let res: FormError[] = []

		for (const b of bags) {
			res = [...res, ...b.errors]
		}

		return new FormErrorBag(res)
	}

	toArray = () => {
		return [...this.errors]
	};

	[Symbol.iterator] = () => {
		return this.errors
	}

	get isEmpty() {
		return this.errors.length === 0
	}

	get first(): any | null {
		if (this.errors.length === 0) return null
		return this.errors[0]
	}
}
