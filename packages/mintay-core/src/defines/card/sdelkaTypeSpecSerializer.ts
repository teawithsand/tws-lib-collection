import { TypeSpecSerializer } from "../typings/serializer"
import { SdelkaTypeSpec } from "./sdelkaTypeSpec"
import { StoredSdelkaCollectionDataSchema } from "./stored/collection/schema"
import { StoredSdelkaCollectionDataSerializer } from "./stored/collection/serializer"
import { StoredSdelkaCardDataSchema } from "./stored/data/schema"
import { StoredSdelkaCardDataSerializer } from "./stored/data/serializer"
import { StoredSdelkaCardEventSchema } from "./stored/event/schema"
import { SdelkaCardEventSerializer } from "./stored/event/serializer"
import { StoredSdelkaCardStateSchema } from "./stored/state/schema"
import { SdelkaCardStateSerializer } from "./stored/state/serializer"

export const SdelkaTypeSpecSerializer: TypeSpecSerializer<SdelkaTypeSpec> = {
	serializeCardData: StoredSdelkaCardDataSerializer.serialize,
	deserializeCardData: (data: unknown) => {
		const parsed = StoredSdelkaCardDataSchema.parse(data)
		return StoredSdelkaCardDataSerializer.deserialize(parsed)
	},
	serializeCollectionHeader: StoredSdelkaCollectionDataSerializer.serialize,
	deserializeCollectionHeader: (data: unknown) => {
		const parsed = StoredSdelkaCollectionDataSchema.parse(data)
		return StoredSdelkaCollectionDataSerializer.deserialize(parsed)
	},
	serializeState: SdelkaCardStateSerializer.serialize,
	deserializeState: (data: unknown) => {
		const parsed = StoredSdelkaCardStateSchema.parse(data)
		return SdelkaCardStateSerializer.deserialize(parsed)
	},
	serializeEvent: SdelkaCardEventSerializer.serialize,
	deserializeEvent: (data: unknown) => {
		const parsed = StoredSdelkaCardEventSchema.parse(data)
		return SdelkaCardEventSerializer.deserialize(parsed)
	},
}
