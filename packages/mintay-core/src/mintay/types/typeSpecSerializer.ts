import { Serializer } from "@teawithsand/reserd"
import { MintayCardEvent } from "./card/event/cardEvent"
import { MintayCardState } from "./card/state/cardState"
import { MintayTypeSpecParams } from "./typeSpec"

export class MintayTypeSpecSerializer<T extends MintayTypeSpecParams> {
	constructor(
		public readonly collectionDataSerializer: Serializer<
			unknown,
			T["collectionData"]
		>,
		public readonly cardDataSerializer: Serializer<unknown, T["cardData"]>,
	) {}

	public readonly cardEventSerializer: Serializer<unknown, MintayCardEvent> =
		{
			serialize: (_event: MintayCardEvent): unknown => {
				throw new Error("Function not implemented.")
			},
			deserialize: (_data: unknown): MintayCardEvent => {
				throw new Error("Function not implemented.")
			},
		}

	public readonly cardStateSerializer: Serializer<unknown, MintayCardState> =
		{
			serialize: (_owned: MintayCardState): unknown => {
				throw new Error("Function not implemented.")
			},
			deserialize: (_stored: unknown): MintayCardState => {
				throw new Error("Function not implemented.")
			},
		}
}
