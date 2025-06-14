import { throwError } from "../throwExpression"
import { DI, DIContents } from "./types"

export class DIImpl<T extends DIContents> implements DI<T> {
	protected constructor(private readonly services: Partial<T>) {}

	public static readonly createFull = <T extends DIContents>(services: T) => {
		return new DIImpl<T>(services)
	}

	public static readonly createPartial = <T extends DIContents>(
		services: Partial<T>,
	) => {
		return new DIImpl(services)
	}

	/**
	 * WARNING this is **unsafe** unless you've asserted that in your builder you've provided.
	 *
	 * Returns all `DIContents`, not `Partial<DIContents>`, like safe version does.
	 */
	public readonly getServicesObjectFullUnsafe = (): T => {
		return this.services as T
	}

	public readonly getServicesObject = (): Partial<T> => {
		return this.services
	}

	public readonly get = <K extends keyof T>(key: K): T[K] => {
		return (
			this.services[key] ??
			throwError(
				new Error(
					`Got null|undefined value for "${String(key)}" was it provided?`,
				),
			)
		)
	}
}
