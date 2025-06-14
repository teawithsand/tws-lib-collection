import { eq } from "drizzle-orm"
import { MintayDrizzleDB } from "../../db/db"
import { cardsTable } from "../../db/schema"
import { CardExtractor, CardId } from "../../defines/typings/defines"
import { CardIdUtil } from "../../defines/typings/internalCardIdUtil"
import { TypeSpecSerializer } from "../../defines/typings/serializer"
import { StorageTypeSpec } from "../../defines/typings/typeSpec"
import { CardHandle, CardStore } from "../defines/card"
import { DrizzleCardHandle } from "./cardHandle"

export class DrizzleCardStore<T extends StorageTypeSpec & { queue: number }>
	implements CardStore<T>
{
	private readonly db: MintayDrizzleDB
	private readonly serializer: TypeSpecSerializer<T>
	private readonly extractor: CardExtractor<T>

	public constructor({
		db,
		serializer,
		cardExtractor,
	}: {
		db: MintayDrizzleDB
		serializer: TypeSpecSerializer<T>
		cardExtractor: CardExtractor<T>
	}) {
		this.db = db
		this.serializer = serializer
		this.extractor = cardExtractor
	}

	public readonly getCardById = async (
		id: CardId,
	): Promise<CardHandle<T> | null> => {
		const card = await this.db
			.select()
			.from(cardsTable)
			.where(eq(cardsTable.id, CardIdUtil.toNumber(id)))
			.get()

		if (!card) {
			return null
		}

		// We need the collectionId for the DrizzleCardHandle.
		// The current schema for cardsTable includes collectionId.
		// If card.collectionId is null or undefined, it means the card is not associated with a collection.
		// Depending on business logic, this might be an error or a valid state.
		// For now, we assume collectionId can be null and DrizzleCardHandle can handle it,
		// or that cards fetched by getCardById are expected to have a collection.
		// If a card MUST have a collection, an error should be thrown here or the query adjusted.
		if (card.collectionId === null || card.collectionId === undefined) {
			// This case needs clarification based on how unassociated cards are handled.
			// For now, let's throw an error if a card is found but has no collectionId,
			// as DrizzleCardHandle requires it.
			throw new Error(
				`Card with ID ${id} found but has no associated collection.`,
			)
		}

		return new DrizzleCardHandle<T>({
			id,
			db: this.db,
			serializer: this.serializer,
			collectionId: CardIdUtil.toNumber(card.collectionId),
			cardExtractor: this.extractor,
		})
	}
}
