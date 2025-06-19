import { MintayTypeSpec } from "@teawithsand/mintay-core"
import { AppCardData } from "./card"
import { AppCollectionData } from "./collection"

export type AppMintayTypeSpecParams = {
	cardData: AppCardData
	collectionData: AppCollectionData
}

export type AppMintayTypeSpec = MintayTypeSpec<AppMintayTypeSpecParams>
