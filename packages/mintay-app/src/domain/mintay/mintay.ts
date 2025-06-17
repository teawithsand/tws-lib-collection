import { CardId } from "@teawithsand/mintay-core"

/**
 * Util used to represent type, which has mintay-core id.
 */
export type WithMintayId<T> = {
	id: CardId
	data: T
}
