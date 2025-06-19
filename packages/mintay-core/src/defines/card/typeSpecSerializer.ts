import { Serializer } from "@teawithsand/reserd"
import { TypeSpecSerializer } from "../typings/serializer"
import { MintayCardEvent } from "./cardEvent"
import { MintayCardState } from "./cardState"
import { MintayTypeSpec, MintayTypeSpecParams } from "./typeSpec"

export class MintayTypeSpecSerializer<T extends MintayTypeSpecParams>
	implements TypeSpecSerializer<MintayTypeSpec<T>>
{
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
