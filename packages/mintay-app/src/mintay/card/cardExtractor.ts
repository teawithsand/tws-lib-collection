import { CardDataExtractor } from "@teawithsand/mintay-core"
import { AppMintayTypeSpec } from "../mintay"
import { AppCardData } from "./card"

/**
 * Extractor for AppCardData, implementing the CardDataExtractor interface.
 * Provides methods to extract essential information from card data.
 */
export class AppCardDataExtractor
	implements CardDataExtractor<AppMintayTypeSpec>
{
	/**
	 * Extracts the global ID from card data.
	 * Since AppCardData doesn't have a globalId field, we generate one based on content.
	 */
	public readonly getGlobalId = (data: AppCardData): string => {
		return data.globalId
	}

	/**
	 * Gets the discovery priority for the card.
	 * Uses the discoveryPriority field from the card data.
	 */
	public readonly getDiscoveryPriority = (data: AppCardData): number => {
		return data.discoveryPriority
	}
}
