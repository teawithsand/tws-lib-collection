import { Serializer } from "@teawithsand/reserd"
import { StorageTypeSpec } from "./typeSpec"

/**
 * @deprecated Each serializer should be passed separately.
 */
export interface TypeSpecSerializer<T extends StorageTypeSpec> {
	collectionDataSerializer: Serializer<unknown, T["collectionData"]>
	cardDataSerializer: Serializer<unknown, T["cardData"]>
	cardEventSerializer: Serializer<unknown, T["cardEvent"]>
	cardStateSerializer: Serializer<unknown, T["cardState"]>
}
