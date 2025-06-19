import { CollectionDataExtractor } from "@teawithsand/mintay-core"
import { AppMintayTypeSpec } from "../mintay"
import { AppCollectionData } from "./collection"

/**
 * Extractor for AppCollectionData, implementing the CollectionDataExtractor interface.
 * Provides methods to extract essential information from collection data.
 */
export class AppCollectionDataExtractor
	implements CollectionDataExtractor<AppMintayTypeSpec>
{
	/**
	 * Extracts the global ID from collection data.
	 * Since AppCollectionData doesn't have a globalId field, we generate one based on content.
	 */
	public readonly getGlobalId = (data: AppCollectionData): string => {
		return data.globalId
	}
}
