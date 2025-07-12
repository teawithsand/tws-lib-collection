import { Timestamp } from "@teawithsand/lngext"
import {
	SerializerTester,
	SimpleSerializedError,
	TestData,
} from "@teawithsand/reserd"
import { describe, test } from "vitest"
import { BlobMetadataResultType } from "../../metadata/metadata"
import { blobMetadataVersioned } from "../../metadata/stored/blobMetadataStored"
import { AbookEntryAggregateData } from "../entryData"
import { AbookEntrySourceType } from "../entrySource"
import { AbookEntryAggregateDataVersionedType } from "./abookEntryAggregateDataStored"

describe("AbookEntryAggregateData versioned serialization", () => {
	test("should serialize and deserialize correctly", () => {
		const testData: AbookEntryAggregateData = {
			metadata: {
				extractTimestamp: Timestamp.fromNumber(1641024000000), // 2022-01-01T12:00:00.000Z
				extractSource: {
					type: AbookEntrySourceType.UPLOAD,
				},
				metadata: {
					image: {
						type: BlobMetadataResultType.SUCCESS,
						metadata: {
							width: 800,
							height: 600,
						},
					},
					audio: {
						type: BlobMetadataResultType.SUCCESS,
						metadata: {
							duration: 3600000, // 1 hour in milliseconds
						},
					},
				},
			},
			blobSize: 1048576, // 1MB
		}

		const serializedExamples = [
			{
				version: 1 as const,
				data: {
					metadata: {
						extractTimestamp: 1641024000000,
						extractSource: {
							type: "upload",
						},
						metadata: blobMetadataVersioned.serialize(
							testData.metadata!.metadata,
						),
					},
					blobSize: 1048576,
				},
			},
			{
				version: 1 as const,
				data: {
					metadata: null,
					blobSize: null,
				},
			},
			{
				version: 1 as const,
				data: {
					metadata: {
						extractTimestamp: 1672531200000, // 2023-01-01T00:00:00.000Z
						extractSource: {
							type: "url",
							url: "https://example.com/audio.mp3",
						},
						metadata: blobMetadataVersioned.serialize({
							image: {
								type: BlobMetadataResultType.ERROR,
								error: SimpleSerializedError.fromAny(
									new Error(
										"Unable to extract image metadata",
									),
								),
							},
							audio: {
								type: BlobMetadataResultType.SUCCESS,
								metadata: {
									duration: 180000, // 3 minutes
								},
							},
						}),
					},
					blobSize: 524288, // 512KB
				},
			},
		]

		const testDataObj = TestData.createFromPairs([
			[serializedExamples[0], testData],
		])

		const tester = new SerializerTester({
			testData: testDataObj,
			serializer:
				AbookEntryAggregateDataVersionedType.getUnknownSerializer(),
		})

		tester.runAllTests()
	})
})
