import { FsDirHandle } from "@teawithsand/fstate"
import {
	JsonEncoder,
	SerializerReverse,
	SerializerUtil,
	TextBufferEncoder,
} from "@teawithsand/reserd"
import { AbookAggregatorImpl } from "../aggregate/abookAggregator"
import { AbookAggregator } from "../defines/abookHandle"
import { AbookEntryAggregator } from "../defines/entryHandle"
import {
	FsAbookStoreAbookDataSerializer,
	FsAbookStoreAbookEntryDataSerializer,
} from "./serializer"
import {
	FsAbookStoreAbookData,
	FsAbookStoreAbookEntryData,
	FsAbookStoreConfig,
} from "./store"

/**
 * Builder class for creating FsAbookStoreConfig with sensible defaults.
 * Provides default implementations for serializers and aggregators.
 *
 * @example
 * ```typescript
 * // Using builder methods:
 * const config1 = new FsAbookStoreConfigBuilder()
 *   .setAbookSerializer(customSerializer)
 *   .build({
 *     root: rootDirHandle,
 *     abookEntryAggregator: myEntryAggregator
 *   })
 *
 * // Using build options (takes priority over builder methods):
 * const config2 = new FsAbookStoreConfigBuilder()
 *   .build({
 *     root: rootDirHandle,
 *     abookEntryAggregator: myEntryAggregator,
 *     abookSerializer: customSerializer,
 *     abookAggregator: customAggregator
 *   })
 *
 * const store = new FsAbookStore(config1)
 * ```
 */
export class FsAbookStoreConfigBuilder {
	private config: Partial<FsAbookStoreConfig> = {}

	/**
	 * Sets a custom abook serializer.
	 * If not called, a default serializer will be used.
	 */
	public readonly setAbookSerializer = (
		serializer: SerializerReverse<FsAbookStoreAbookData, ArrayBuffer>,
	): this => {
		this.config.abookSerializer = serializer
		return this
	}

	/**
	 * Sets a custom abook entry serializer.
	 * If not called, a default serializer will be used.
	 */
	public readonly setAbookEntrySerializer = (
		serializer: SerializerReverse<FsAbookStoreAbookEntryData, ArrayBuffer>,
	): this => {
		this.config.abookEntrySerializer = serializer
		return this
	}

	/**
	 * Sets a custom abook aggregator.
	 * If not called, a default aggregator will be used.
	 */
	public readonly setAbookAggregator = (
		aggregator: AbookAggregator,
	): this => {
		this.config.abookAggregator = aggregator
		return this
	}

	/**
	 * Builds the final configuration with defaults applied where needed.
	 * @param options - Configuration options
	 * @param options.root - Root directory handle for the store
	 * @param options.abookEntryAggregator - Abook entry aggregator implementation
	 * @param options.abookSerializer - Optional abook serializer (overrides builder setting)
	 * @param options.abookEntrySerializer - Optional abook entry serializer (overrides builder setting)
	 * @param options.abookAggregator - Optional abook aggregator (overrides builder setting)
	 */
	public readonly build = (options: {
		root: FsDirHandle
		abookEntryAggregator: AbookEntryAggregator
		abookSerializer?: SerializerReverse<FsAbookStoreAbookData, ArrayBuffer>
		abookEntrySerializer?: SerializerReverse<
			FsAbookStoreAbookEntryData,
			ArrayBuffer
		>
		abookAggregator?: AbookAggregator
	}): FsAbookStoreConfig => {
		return {
			root: options.root,
			abookSerializer:
				options.abookSerializer ??
				this.config.abookSerializer ??
				this.createDefaultAbookSerializer(),
			abookEntrySerializer:
				options.abookEntrySerializer ??
				this.config.abookEntrySerializer ??
				this.createDefaultAbookEntrySerializer(),
			abookAggregator:
				options.abookAggregator ??
				this.config.abookAggregator ??
				this.createDefaultAbookAggregator(),
			abookEntryAggregator: options.abookEntryAggregator,
		}
	}

	/**
	 * Creates the default serializer chain for abook data.
	 * Composes: FsAbookStoreAbookDataSerializer -> JsonEncoder -> TextBufferEncoder
	 */
	private readonly createDefaultAbookSerializer = (): SerializerReverse<
		FsAbookStoreAbookData,
		ArrayBuffer
	> =>
		SerializerUtil.compose(
			FsAbookStoreAbookDataSerializer,
			SerializerUtil.compose(
				SerializerUtil.encoderToSerializer(new JsonEncoder()),
				SerializerUtil.encoderToSerializer(new TextBufferEncoder()),
			),
		)

	/**
	 * Creates the default serializer chain for abook entry data.
	 * Composes: FsAbookStoreAbookEntryDataSerializer -> JsonEncoder -> TextBufferEncoder
	 */
	private readonly createDefaultAbookEntrySerializer = (): SerializerReverse<
		FsAbookStoreAbookEntryData,
		ArrayBuffer
	> =>
		SerializerUtil.compose(
			FsAbookStoreAbookEntryDataSerializer,
			SerializerUtil.compose(
				SerializerUtil.encoderToSerializer(new JsonEncoder()),
				SerializerUtil.encoderToSerializer(new TextBufferEncoder()),
			),
		)

	/**
	 * Creates the default abook aggregator.
	 */
	private readonly createDefaultAbookAggregator = (): AbookAggregator =>
		AbookAggregatorImpl.create()
}
