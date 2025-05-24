import { TypeSpecSerializer } from "../typings/serializer"
import { MintayTypeSpec } from "./sdelkaTypeSpec"
import { StoredMintayCollectionDataSchema } from "./stored/collection/schema"
import { StoredMintayCollectionDataSerializer } from "./stored/collection/serializer"
import { StoredMintayCardDataSchema } from "./stored/data/schema"
import { StoredMintayCardDataSerializer } from "./stored/data/serializer"
import { StoredMintayCardEventSchema } from "./stored/event/schema"
import { MintayCardEventSerializer } from "./stored/event/serializer"
import { StoredMintayCardStateSchema } from "./stored/state/schema"
import { MintayCardStateSerializer } from "./stored/state/serializer"

export const MintayTypeSpecSerializer: TypeSpecSerializer<MintayTypeSpec> = {
	serializeCardData: StoredMintayCardDataSerializer.serialize,
	deserializeCardData: (data: unknown) => {
		const parsed = StoredMintayCardDataSchema.parse(data)
		return StoredMintayCardDataSerializer.deserialize(parsed)
	},
	serializeCollectionHeader: StoredMintayCollectionDataSerializer.serialize,
	deserializeCollectionHeader: (data: unknown) => {
		const parsed = StoredMintayCollectionDataSchema.parse(data)
		return StoredMintayCollectionDataSerializer.deserialize(parsed)
	},
	serializeState: MintayCardStateSerializer.serialize,
	deserializeState: (data: unknown) => {
		const parsed = StoredMintayCardStateSchema.parse(data)
		return MintayCardStateSerializer.deserialize(parsed)
	},
	serializeEvent: MintayCardEventSerializer.serialize,
	deserializeEvent: (data: unknown) => {
		const parsed = StoredMintayCardEventSchema.parse(data)
		return MintayCardEventSerializer.deserialize(parsed)
	},
}
