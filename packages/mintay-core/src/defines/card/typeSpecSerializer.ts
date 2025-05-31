import { TypeSpecSerializer } from "../typings/serializer"
import {
	storedMintayCardDataVersionedType,
	storedMintayCollectionDataVersionedType,
} from "./stored"
import { StoredMintayCollectionDataSchema } from "./stored/collection/schema"
import { StoredMintayCardDataSchema } from "./stored/data/schema"
import { StoredMintayCardEventSchema } from "./stored/event/schema"
import { storedMintayCardEventVersionedType } from "./stored/event/serializer"
import { StoredMintayCardStateSchema } from "./stored/state/schema"
import { storedMintayCardStateVersionedType } from "./stored/state/serializer"
import { MintayTypeSpec } from "./typeSpec"

export const MintayTypeSpecSerializer: TypeSpecSerializer<MintayTypeSpec> = {
	serializeCardData: storedMintayCardDataVersionedType.serialize,
	deserializeCardData: (data: unknown) => {
		const parsed = StoredMintayCardDataSchema.parse(data)
		return storedMintayCardDataVersionedType.deserialize(parsed)
	},
	serializeCollectionHeader:
		storedMintayCollectionDataVersionedType.serialize,
	deserializeCollectionHeader: (data: unknown) => {
		const parsed = StoredMintayCollectionDataSchema.parse(data)
		return storedMintayCollectionDataVersionedType.deserialize(parsed)
	},
	serializeState: storedMintayCardStateVersionedType.serialize,
	deserializeState: (data: unknown) => {
		const parsed = StoredMintayCardStateSchema.parse(data)
		return storedMintayCardStateVersionedType.deserialize(parsed)
	},
	serializeEvent: storedMintayCardEventVersionedType.serialize,
	deserializeEvent: (data: unknown) => {
		const parsed = StoredMintayCardEventSchema.parse(data)
		return storedMintayCardEventVersionedType.deserialize(parsed)
	},
}
