import { Clock, DefaultClock } from "@teawithsand/lngext"
import {
	AbookEntryAggregateData,
	AbookEntryData,
	BlobMetadataExtractor,
} from "../../defines"
import { AbookEntrySourceUtil } from "../../defines/abookEntry/entrySource"
import { BlobMetadataExtractorImpl } from "../../extractor/extractorImpl"
import { AbookEntryAggregator } from "../defines/entryHandle"

/**
 * Implementation of AbookEntryAggregator that uses BlobMetadataExtractor
 * to extract metadata from blob content and create aggregate data.
 */
export class AbookEntryAggregatorImpl implements AbookEntryAggregator {
	constructor(options: {
		metadataExtractor: BlobMetadataExtractor
		clock?: Clock
	}) {
		this.metadataExtractor = options.metadataExtractor
		this.clock = options.clock ?? DefaultClock.getInstance()
	}

	private readonly metadataExtractor: BlobMetadataExtractor
	private readonly clock: Clock

	/**
	 * Creates a new AbookEntryAggregatorImpl with reasonable defaults.
	 */
	public static readonly create = (): AbookEntryAggregatorImpl => {
		return new AbookEntryAggregatorImpl({
			metadataExtractor: new BlobMetadataExtractorImpl(),
		})
	}

	/**
	 * Aggregates entry data by extracting metadata from the provided blob.
	 * Returns aggregate data containing extracted metadata and blob size information.
	 */
	public readonly aggregate = async (
		data: AbookEntryData,
		blob: Blob,
	): Promise<AbookEntryAggregateData> => {
		const extractedMetadata =
			await this.metadataExtractor.extractFromBlob(blob)

		const aggregateData: AbookEntryAggregateData = {
			metadata: {
				extractTimestamp: this.clock.getNow(),
				extractSource: AbookEntrySourceUtil.toLite(data.source),
				metadata: extractedMetadata,
			},
			blobSize: blob.size,
		}

		return aggregateData
	}
}
