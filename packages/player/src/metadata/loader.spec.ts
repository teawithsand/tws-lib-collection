import { beforeEach, describe, expect, test } from "vitest"
import { PlayerEntryType } from "../player"
import { AUDIO_10S_URL, AUDIO_1S_URL, AUDIO_BAD_URL } from "../soundFiles.test"
import { AudioDurationLoaderImpl } from "./loader"

describe("AudioDurationLoader", () => {
	let loader: AudioDurationLoaderImpl

	beforeEach(() => {
		loader = new AudioDurationLoaderImpl()
	})

	test("should load 1 second audio duration", async () => {
		const duration = await loader.loadDuration({
			type: PlayerEntryType.URL,
			url: AUDIO_1S_URL,
		})
		expect(duration).toBeGreaterThanOrEqual(0.9)
		expect(duration).toBeLessThanOrEqual(1.1)
	})

	test("should load 10 seconds audio duration", async () => {
		const duration = await loader.loadDuration({
			type: PlayerEntryType.URL,
			url: AUDIO_10S_URL,
		})
		expect(duration).toBeGreaterThanOrEqual(9.9)
		expect(duration).toBeLessThanOrEqual(10.1)
	})

	test("should reject for invalid audio URL", async () => {
		await expect(
			loader.loadDuration({
				type: PlayerEntryType.URL,
				url: AUDIO_BAD_URL,
			}),
		).rejects.toThrow("Failed to load audio metadata")
	})
})
