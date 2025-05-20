import { z } from "zod"
import { ResultType } from "../../../utils/result"
import { ABookEntry, ABookEntryDisposition } from "../entry"

// Stored enum copies
export enum StoredABookEntryDispositionV1 {
	AUDIO = 1,
	IMAGE = 2,
	DESCRIPTION = 3,
}

export type StoredABookEntryDisposition = StoredABookEntryDispositionV1

// Stored types and schemas for ABookEntry only
export const StoredABookEntryV1Schema = z.object({
	disposition: z.nativeEnum(StoredABookEntryDispositionV1),
	metadata: z.object({
		uploadMetadata: z
			.object({
				fileName: z.string().nullable(),
				lastModifiedTimestamp: z.number().nullable(),
				fileSize: z.number(),
				path: z.string().nullable(),
			})
			.nullable(),
		audioMetadata: z
			.object({
				duration: z.object({
					type: z.literal("ok").or(z.literal("err")),
					value: z.number().or(z.any()),
				}),
			})
			.nullable(),
	}),
	locator: z.union([
		z.object({
			type: z.literal(1),
			id: z.string(),
		}),
		z.object({
			type: z.literal(2),
			url: z.string(),
		}),
	]),
})
export type StoredABookEntryV1 = z.infer<typeof StoredABookEntryV1Schema>
export type StoredABookEntry = StoredABookEntryV1
export const StoredABookEntrySchema = StoredABookEntryV1Schema

export class ABookEntrySerializer {
	private constructor() {}

	private static readonly toStoredDisposition = (
		d: ABookEntryDisposition,
	): StoredABookEntryDispositionV1 => {
		switch (d) {
			case ABookEntryDisposition.AUDIO:
				return StoredABookEntryDispositionV1.AUDIO
			case ABookEntryDisposition.IMAGE:
				return StoredABookEntryDispositionV1.IMAGE
			case ABookEntryDisposition.DESCRIPTION:
				return StoredABookEntryDispositionV1.DESCRIPTION
			default:
				throw new Error("Unknown ABookEntryDisposition")
		}
	}

	private static readonly fromStoredDisposition = (
		d: StoredABookEntryDispositionV1,
	): ABookEntryDisposition => {
		switch (d) {
			case StoredABookEntryDispositionV1.AUDIO:
				return ABookEntryDisposition.AUDIO
			case StoredABookEntryDispositionV1.IMAGE:
				return ABookEntryDisposition.IMAGE
			case StoredABookEntryDispositionV1.DESCRIPTION:
				return ABookEntryDisposition.DESCRIPTION
			default:
				throw new Error("Unknown StoredABookEntryDispositionV1")
		}
	}

	private static readonly toStoredLocator = (
		locator: ABookEntry["locator"],
	): StoredABookEntry["locator"] => {
		if (locator.type === 1) {
			return { type: 1, id: locator.id }
		}
		return { type: 2, url: locator.url }
	}

	private static readonly fromStoredLocator = (
		locator: StoredABookEntry["locator"],
	): ABookEntry["locator"] => {
		if (locator.type === 1) {
			return { type: 1, id: locator.id }
		}
		return { type: 2, url: locator.url }
	}

	public static readonly serialize = (
		entry: ABookEntry,
	): StoredABookEntry => ({
		disposition: ABookEntrySerializer.toStoredDisposition(
			entry.disposition,
		),
		metadata: entry.metadata
			? {
					uploadMetadata: entry.metadata.uploadMetadata
						? { ...entry.metadata.uploadMetadata }
						: null,
					audioMetadata: entry.metadata.audioMetadata
						? {
								duration:
									entry.metadata.audioMetadata.duration
										.type === ResultType.OK
										? {
												type: "ok",
												value: entry.metadata
													.audioMetadata.duration
													.value,
											}
										: {
												type: "err",
												value: entry.metadata
													.audioMetadata.duration
													.error,
											},
							}
						: null,
				}
			: { uploadMetadata: null, audioMetadata: null },
		locator: ABookEntrySerializer.toStoredLocator(entry.locator),
	})

	public static readonly deserialize = (
		stored: StoredABookEntry,
	): ABookEntry => ({
		disposition: ABookEntrySerializer.fromStoredDisposition(
			stored.disposition,
		),
		metadata: stored.metadata
			? {
					uploadMetadata: stored.metadata.uploadMetadata
						? { ...stored.metadata.uploadMetadata }
						: null,
					audioMetadata: stored.metadata.audioMetadata
						? {
								duration:
									stored.metadata.audioMetadata.duration
										.type === "ok"
										? {
												type: ResultType.OK,
												value: stored.metadata
													.audioMetadata.duration
													.value,
											}
										: {
												type: ResultType.ERROR,
												error: stored.metadata
													.audioMetadata.duration
													.value,
											},
							}
						: null,
				}
			: { uploadMetadata: null, audioMetadata: null },
		locator: ABookEntrySerializer.fromStoredLocator(stored.locator),
	})
}
