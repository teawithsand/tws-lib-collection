import { DIError } from "./error"
import { DIImpl } from "./impl"
import { DI, DIContents, DIContentsFactory, DIDefinitionObject } from "./types"

export class DIBuilder<T extends DIContents> {
	private lastOrder = 0
	private factories: Partial<DIContentsFactory<T>> = {}
	private orders: Partial<{ [K in keyof T]: number }> = {}

	protected constructor() {}

	public static readonly create = <T extends DIContents>() => {
		return new DIBuilder<T>()
	}

	public readonly setValue = <K extends keyof T>(
		key: K,
		value: T[K],
	): this => {
		this.factories[key] = async () => value
		this.orders[key] = -1 // they take no arguments, so they can go first

		return this
	}

	public readonly setFactory = <K extends keyof T>(
		key: K,
		factory: (di: DI<T>) => Promise<T[K]>,
	): this => {
		this.factories[key] = factory
		this.orders[key] = this.lastOrder

		this.lastOrder += 1

		return this
	}

	public readonly setValues = (values: Partial<T>): this => {
		for (const [key, value] of Object.entries(values)) {
			this.setValue(key as keyof T, value)
		}
		return this
	}

	public readonly setFactories = (
		factories: Partial<DIContentsFactory<T>>,
	): this => {
		for (const [key, factory] of Object.entries(factories)) {
			if (factory) {
				this.setFactory(key as keyof T, factory)
			}
		}
		return this
	}

	public readonly assertAllDefinedWithDefinitionObject = (
		defines: DIDefinitionObject<T>,
	): this => {
		this.assertAllDefinesWithKeyofArray(Object.keys(defines))
		return this
	}

	public readonly assertAllDefinesWithKeyofArray = (
		keys: (keyof T)[],
	): this => {
		for (const key of keys) {
			if (this.factories[key] === undefined) {
				throw new DIError(
					`Key "${String(key)}" is not defined in builder, even though it should be`,
				)
			}
		}

		return this
	}

	public readonly clone = (): DIBuilder<T> => {
		const builder = new DIBuilder<T>()
		builder.factories = { ...this.factories }
		builder.lastOrder = this.lastOrder
		builder.orders = { ...this.orders }

		return builder
	}

	public readonly build = async (): Promise<DIImpl<T>> => {
		const container: Partial<T> = {}

		const keysQueue = [...Object.entries(this.orders)]
			.sort((a, b) => {
				const aVal = a[1]
				const bVal = b[1]

				if (aVal === undefined || bVal === undefined) {
					throw new DIError(
						`Assertion filed: got undefined. Was some container value not provided?`,
					)
				}
				return aVal - bVal
			})
			.map((x) => x[0])

		for (const rawKey of keysQueue) {
			const key: keyof T = rawKey
			const partialDI = DIImpl.createPartial(container)

			const factory = this.factories[key]
			if (!factory) {
				throw new DIError(`Got no factory for key: "${String(key)}"`)
			}

			try {
				const value = await factory(partialDI)
				container[key] = value
			} catch {
				throw new DIError(
					`Filed to initialize key: "${String(key)}" while building DI; Factory has thrown`,
				)
			}
		}

		return DIImpl.createFull(container as T)
	}
}
