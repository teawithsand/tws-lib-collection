/**
 * Basic Setup Example
 *
 * Demonstrates how to configure and initialize a Mintay instance
 * with custom collection and card data types.
 */
import {
	CardDataExtractor,
	CollectionDataExtractor,
	InMemoryMintay,
	LockingMintay,
	MintayParams,
	MintayTypeSpec,
	MintayTypeSpecParams,
} from "../src"

// 1. Define your custom data types
type MyCollectionData = {
	globalId: string
	name: string
}

type MyCardData = {
	globalId: string
	question: string
	answer: string
	discoveryPriority: number
}

// 2. Define your type specification
type MyTypeSpecParams = MintayTypeSpecParams & {
	collectionData: MyCollectionData
	cardData: MyCardData
}

// 3. Create extractors (required by Mintay to access key fields)
class MyCollectionDataExtractor
	implements CollectionDataExtractor<MintayTypeSpec<MyTypeSpecParams>>
{
	public readonly getGlobalId = (data: MyCollectionData): string =>
		data.globalId
}

class MyCardDataExtractor
	implements CardDataExtractor<MintayTypeSpec<MyTypeSpecParams>>
{
	public readonly getGlobalId = (data: MyCardData): string => data.globalId
	public readonly getDiscoveryPriority = (data: MyCardData): number =>
		data.discoveryPriority
}

// 4. Create MintayParams configuration
const params: MintayParams<MyTypeSpecParams> = {
	collectionDataExtractor: new MyCollectionDataExtractor(),
	cardDataExtractor: new MyCardDataExtractor(),
	// Simple pass-through serializers for in-memory use
	collectionDataSerializer: {
		serialize: (data: MyCollectionData): unknown => data as unknown,
		deserialize: (data: unknown): MyCollectionData =>
			data as MyCollectionData,
	},
	cardDataSerializer: {
		serialize: (data: MyCardData): unknown => data as unknown,
		deserialize: (data: unknown): MyCardData => data as MyCardData,
	},
	defaultCollectionDataFactory: () => ({ globalId: "", name: "" }),
	defaultCardDataFactory: () => ({
		globalId: "",
		question: "",
		answer: "",
		discoveryPriority: 0,
	}),
}

// 5. Create a thread-safe Mintay instance
const mintay = LockingMintay.wrapSafe(new InMemoryMintay({ params }))

// Now you can use mintay.collectionStore, mintay.cardStore, and mintay.getEngineStore()
export { mintay, params }
