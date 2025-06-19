import { MintayTypeSpec } from "@teawithsand/mintay-core"
import { AppCardData } from "./card"
import { AppCollectionData } from "./collection"

export type AppMintayTypeSpec = MintayTypeSpec<{
	cardData: AppCardData
	collectionData: AppCollectionData
}>
