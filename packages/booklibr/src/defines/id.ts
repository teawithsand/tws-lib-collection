export type Id = string | number

export type WithId<T> = {
	data: T
	id: Id
}

export class IdUtil {
	private constructor() {}

	public static readonly toNumber = (id: Id): number => {
		if (typeof id === "number") {
			return id
		} else if (typeof id === "string") {
			const parsed = parseInt(id, 10)
			if (isNaN(parsed)) {
				throw new Error(`Invalid ID: ${id}`)
			}
			return parsed
		} else {
			throw new Error(`Unsupported ID type: ${typeof id}`)
		}
	}

	public static readonly toString = (id: Id): string => {
		if (typeof id === "string") {
			return id
		} else if (typeof id === "number") {
			return id.toString()
		} else {
			throw new Error(`Unsupported ID type: ${typeof id}`)
		}
	}
}
