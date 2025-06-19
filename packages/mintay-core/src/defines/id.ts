/**
 * Universal identifier type used throughout the system for both cards and collections.
 *
 * Prefixed with Mintay* to indicate its association with the Mintay system.
 */
export type MintayId = string | number

export class MintayIdUtil {
	private constructor() {}

	public static readonly toString = (id: MintayId): string => {
		return String(id)
	}

	public static readonly toNumber = (id: MintayId): number => {
		if (typeof id === "number") {
			if (!Number.isInteger(id)) {
				throw new Error("CardId number must be an integer")
			}
			return id
		}
		if (!/^[-+]?\d+$/.test(id)) {
			throw new Error("CardId string must be a valid integer number")
		}
		const res = parseInt(id)
		if (!Number.isInteger(res) || Number.isNaN(res) || res < 0) {
			throw new Error("CardId string must be a valid integer number")
		}
		return res
	}
}
