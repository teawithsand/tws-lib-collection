import { CardId } from "./defines"

export class CardIdUtil {
	private constructor() {}

	public static readonly toString = (id: CardId): string => {
		return String(id)
	}

	public static readonly toNumber = (id: CardId): number => {
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
