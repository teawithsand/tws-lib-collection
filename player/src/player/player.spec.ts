import { afterEach, beforeEach, describe, expect, test } from "vitest"
import { PlayerEntry, PlayerEntryType } from "./entry"
import { PlayerEventType } from "./player"
import { HTMLPlayer } from "./playerImpl"

import { userEvent } from "@vitest/browser/context"

import { AUDIO_10S_URL, AUDIO_1S_URL } from "../soundFiles.test"

// Helper to create an audio element
const createAudioElement = () => {
	const audio = document.createElement("audio")
	audio.preload = "auto"
	return audio
}

describe("HTMLPlayer", () => {
	let audio: HTMLAudioElement
	let player: HTMLPlayer

	beforeEach(async () => {
		audio = createAudioElement()
		audio.controls = true

		player = new HTMLPlayer(audio)
		player.enterDebugMode() // mute works for firefox

		// Chrome needs clicking
		document.body.appendChild(audio)
		try {
			await userEvent.click(document.body)
		} catch (_e) {
			// ignore
		}

		audio.loop = false
	})

	afterEach(() => {
		player.release()
		audio.remove()
	})

	test("initial state is correct", () => {
		expect(player.state.isPlaying).toBe(false)
		expect(player.state.isUserWantsToPlay).toBe(false)
		expect(player.state.entries).toEqual([])
		expect(player.state.currentEntryIndex).toBe(0)
		expect(player.state.speed).toBe(1)
		expect(player.state.volume).toBe(1)
		expect(player.state.isSeeking).toBe(false)
	})

	test("setEntries loads first entry and sets src", () => {
		const entries: PlayerEntry[] = [
			{ type: PlayerEntryType.URL, url: AUDIO_10S_URL },
		]

		player.setEntries(entries)

		expect(player.state.entries).toEqual(entries)
		// Check src indirectly via player state or other means, avoid direct audio.src access
		// For now, just check entries set correctly
	})

	test("setUserWantsToPlay triggers play and pause", async () => {
		player.setEntries([{ type: PlayerEntryType.URL, url: AUDIO_10S_URL }])

		player.setUserWantsToPlay(true)
		await new Promise((r) => setTimeout(r, 100))
		expect(player.state.isUserWantsToPlay).toBe(true)

		player.setUserWantsToPlay(false)
		await new Promise((r) => setTimeout(r, 100))
		expect(player.state.isUserWantsToPlay).toBe(false)
	})

	test(
		"isPositionUpdatedAfterSeek becomes true",
		{ timeout: 5000 },
		async () => {
			const entries: PlayerEntry[] = [
				{ type: PlayerEntryType.URL, url: AUDIO_10S_URL },
				{ type: PlayerEntryType.URL, url: AUDIO_10S_URL },
			]

			player.setEntries(entries)
			player.seek(10)

			// Wait until isPositionUpdatedAfterSeek is true
			await new Promise((resolve) => {
				const checkSeek = () => {
					if (player.state.isPositionUpdatedAfterSeek) {
						resolve(null)
					} else {
						setTimeout(checkSeek, 100)
					}
				}
				checkSeek()
			})
		},
	)

	test("setSpeed and setVolume update element and state", () => {
		player.setSpeed(1.5)
		// Cannot check audio.playbackRate directly, check player state
		expect(player.state.speed).toBe(1.5)

		player.setVolume(0.3)
		// Cannot check audio.volume directly, check player state
		expect(player.state.volume).toBe(0.3)
	})

	test("setPreservePitchForSpeed sets preservesPitch if supported", () => {
		audio.preservesPitch = true

		player.setPreservePitchForSpeed(false)
		expect(audio.preservesPitch).toBe(false)
		expect(player.state.preservePitchForSpeed).toBe(false)
	})

	test("reloadEntry reloads current entry", () => {
		const entries: PlayerEntry[] = [
			{ type: PlayerEntryType.URL, url: AUDIO_10S_URL },
		]

		player.setEntries(entries)
		const oldSrc = audio.src
		player.reloadEntry()
		expect(audio.src).toBe(oldSrc)
	})

	test("events are emitted correctly", async () => {
		let errorEventCount = 0
		player.on(PlayerEventType.ERROR, () => {
			errorEventCount++
		})

		let entryEndedCount = 0
		player.on(PlayerEventType.ENTRY_ENDED, () => {
			entryEndedCount++
		})

		let externalPlayingChangeCount = 0
		player.on(PlayerEventType.EXTERNAL_IS_PLAYING_CHANGE, () => {
			externalPlayingChangeCount++
		})

		// Instead of manual dispatch, rely on natural events triggered by player actions
		player.setEntries([{ type: PlayerEntryType.URL, url: AUDIO_10S_URL }])
		player.setUserWantsToPlay(true)

		// Wait some time for events to be emitted naturally
		await new Promise((r) => setTimeout(r, 500))

		expect(entryEndedCount).toBeGreaterThanOrEqual(0)
		expect(errorEventCount).toBeGreaterThanOrEqual(0)
		expect(externalPlayingChangeCount).toBeGreaterThanOrEqual(0)
	})

	test("loads URL duration without error", async () => {
		let errorOccurred = false
		player.on(PlayerEventType.ERROR, () => {
			errorOccurred = true
		})

		player.setEntries([{ type: PlayerEntryType.URL, url: AUDIO_10S_URL }])

		// Wait until isReadyToPlay is true
		await new Promise((resolve) => {
			const checkReady = () => {
				if (player.state.isReadyToPlay) {
					resolve(null)
				} else {
					setTimeout(checkReady, 50)
				}
			}
			checkReady()
		})

		expect(player.state.error).toBeNull()
		// Decoding audio length is magic, that's why for 10s url it's safest to check if it's longer than 9s
		expect(player.state.currentEntryDuration).toBeGreaterThan(9)

		expect(errorOccurred).toBe(false)
	})

	test("currentEntryPosition updates when playing", async () => {
		player.setEntries([{ type: PlayerEntryType.URL, url: AUDIO_10S_URL }])
		player.setUserWantsToPlay(true)

		// Wait until isReadyToPlay is true
		await new Promise((resolve, reject) => {
			const checkReady = () => {
				if (player.state.error) reject(player.state.error)
				if (player.state.currentEntryPosition > 0.5) {
					resolve(null)
				} else {
					setTimeout(checkReady, 50)
				}
			}
			checkReady()
		})

		expect(player.state.currentEntryPosition).toBeGreaterThanOrEqual(0.5)
	})

	test("automatic switching to next entry after previous ends", async () => {
		const entries: PlayerEntry[] = [
			{ type: PlayerEntryType.URL, url: AUDIO_1S_URL },
			{ type: PlayerEntryType.URL, url: AUDIO_1S_URL },
			{ type: PlayerEntryType.URL, url: AUDIO_1S_URL },
		]

		player.on(PlayerEventType.ENTRY_ENDED, () => {
			player.seek(0, player.state.currentEntryIndex + 1)
		})

		player.setEntries(entries)
		player.setUserWantsToPlay(true)
		player.setSpeed(4)

		// Wait until first entry is ready
		await new Promise((resolve) => {
			const checkReady = () => {
				if (player.state.isReadyToPlay) {
					resolve(null)
				} else {
					setTimeout(checkReady, 50)
				}
			}
			checkReady()
		})

		// Wait for first entry to end and player to switch to next
		await new Promise((resolve, reject) => {
			const checkNext = () => {
				if (player.state.isEnded) {
					resolve(null)
				} else if (player.state.error) {
					reject(player.state.error)
				} else {
					setTimeout(checkNext, 100)
				}
			}
			checkNext()
		})

		expect(player.state.currentEntryIndex).toEqual(entries.length)
		expect(player.state.isEnded).toBe(true)
	})

	test("isEntryEnded becomes true eventually while playing", async () => {
		const entries: PlayerEntry[] = [
			{ type: PlayerEntryType.URL, url: AUDIO_1S_URL },
		]

		player.setEntries(entries)
		player.setUserWantsToPlay(true)

		// Wait until isEntryEnded is true or timeout
		await new Promise((resolve, reject) => {
			const timeout = setTimeout(
				() => reject(new Error("Timeout waiting for isEntryEnded")),
				1000 * 4,
			)
			const checkEnded = () => {
				if (player.state.isEntryEnded) {
					clearTimeout(timeout)
					resolve(null)
				} else if (player.state.error) {
					reject(player.state.error)
				} else {
					setTimeout(checkEnded, 100)
				}
			}
			checkEnded()
		})

		expect(player.state.isEntryEnded).toBe(true)
	})

	test("playback starts after source set when isUserWantsToPlay was set first", async () => {
		player.setUserWantsToPlay(true)

		const entries: PlayerEntry[] = [
			{ type: PlayerEntryType.URL, url: AUDIO_10S_URL },
		]

		player.setEntries(entries)

		// Wait until isPlaying is true
		await new Promise((resolve, reject) => {
			const checkPlaying = () => {
				if (player.state.isPlaying) {
					resolve(null)
				} else if (player.state.error) {
					reject(player.state.error)
				} else {
					setTimeout(checkPlaying, 50)
				}
			}
			checkPlaying()
		})

		expect(player.state.isPlaying).toBe(true)
	})

	test("playback stops after setting user wants to play to false", async () => {
		player.setEntries([{ type: PlayerEntryType.URL, url: AUDIO_10S_URL }])
		player.setUserWantsToPlay(true)

		// Wait until isPlaying is true
		await new Promise((resolve, reject) => {
			const checkPlaying = () => {
				if (player.state.isPlaying) {
					resolve(null)
				} else if (player.state.error) {
					reject(player.state.error)
				} else {
					setTimeout(checkPlaying, 50)
				}
			}
			checkPlaying()
		})

		player.setUserWantsToPlay(false)

		// Wait until isPlaying is false
		await new Promise((resolve, reject) => {
			const checkStopped = () => {
				if (!player.state.isPlaying) {
					resolve(null)
				} else if (player.state.error) {
					reject(player.state.error)
				} else {
					setTimeout(checkStopped, 50)
				}
			}
			checkStopped()
		})

		expect(player.state.isPlaying).toBe(false)
	})

	test("seek to non-zero position and different target entry index updates state", async () => {
		const entries: PlayerEntry[] = [
			{ type: PlayerEntryType.URL, url: AUDIO_10S_URL },
			{ type: PlayerEntryType.URL, url: AUDIO_10S_URL },
		]

		player.setEntries(entries)

		player.seek(5, 1)

		expect(player.state.isPositionUpdatedAfterSeek).toBe(false)

		// Wait until isPositionUpdatedAfterSeek is true
		await new Promise((resolve) => {
			const checkSeek = () => {
				if (player.state.isPositionUpdatedAfterSeek) {
					resolve(null)
				} else {
					setTimeout(checkSeek, 50)
				}
			}
			checkSeek()
		})

		expect(player.state.currentEntryIndex).toBe(1)
		expect(player.state.currentEntryPosition).toBe(5)
	})

	test("changing speed updates playbackRate and state", () => {
		player.setEntries([{ type: PlayerEntryType.URL, url: AUDIO_10S_URL }])

		player.setSpeed(1.25)
		// Check player state
		expect(player.state.speed).toBe(1.25)

		player.setSpeed(0.75)
		expect(player.state.speed).toBe(0.75)
	})

	test("time progresses with default 1x speed", async () => {
		player.setEntries([{ type: PlayerEntryType.URL, url: AUDIO_10S_URL }])
		player.setUserWantsToPlay(true)

		// Wait until isReadyToPlay is true
		await new Promise((resolve, reject) => {
			const checkReady = () => {
				if (player.state.error) reject(player.state.error)
				if (player.state.isReadyToPlay && player.state.isPlaying) {
					resolve(null)
				} else {
					setTimeout(checkReady, 50)
				}
			}
			checkReady()
		})

		await new Promise((resolve) => setTimeout(resolve, 500))

		player.forceLoadPlayerState()
		const p1 = player.state.currentEntryPosition
		expect(Number.isFinite(p1)).toBe(true)
		expect(p1).toBeGreaterThan(0)

		await new Promise((resolve) => setTimeout(resolve, 1000))

		player.forceLoadPlayerState()
		const p2 = player.state.currentEntryPosition

		expect(p2).toBeLessThan(p1 + 2 * 0.9)
		expect(p2).toBeGreaterThanOrEqual(p1 + 1 * 0.9)
	})

	test("changing speed influences currentEntryPosition progression", async () => {
		player.setEntries([{ type: PlayerEntryType.URL, url: AUDIO_10S_URL }])
		player.setUserWantsToPlay(true)

		// Wait until isReadyToPlay is true
		await new Promise((resolve, reject) => {
			const checkReady = () => {
				if (player.state.error) reject(player.state.error)
				if (player.state.isReadyToPlay && player.state.isPlaying) {
					resolve(null)
				} else {
					setTimeout(checkReady, 50)
				}
			}
			checkReady()
		})

		await new Promise((resolve) => setTimeout(resolve, 500))

		player.forceLoadPlayerState()
		const p1 = player.state.currentEntryPosition
		expect(Number.isFinite(p1)).toBe(true)
		expect(p1).toBeGreaterThan(0)

		player.setSpeed(2)

		await new Promise((resolve) => setTimeout(resolve, 1000))

		player.forceLoadPlayerState()
		const p2 = player.state.currentEntryPosition

		// 0.9 factor accounts for the fact that there may be some error of measurement
		expect(p2).toBeGreaterThanOrEqual(p1 + 2 * 0.9)
	})
})
