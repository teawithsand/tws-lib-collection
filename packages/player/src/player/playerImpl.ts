import {
	DefaultEventBus,
	DefaultStickyEventBus,
	SubscribableUtil,
} from "@teawithsand/fstate"
import {
	HtmlMediaElementState,
	getHtmlMediaElementState,
} from "../html/nativeState" // Adjust import path accordingly
import { PlayerEntry, PlayerEntryType } from "./entry"
import { Player, PlayerEvent, PlayerEventType, PlayerState } from "./player"

export class HTMLPlayer implements Player {
	private element: HTMLMediaElement
	private readonly innerState: Readonly<PlayerState>

	private freeSourceCallback: (() => void) | null = null

	private afterLoadSeekTarget: number = 0
	private lastPositionLoadSeekStarted: number = -2

	private readonly innerStateBus
	private readonly innerPlayerBus

	private readonly eventListeners: Array<[string, any]> = []

	constructor(mediaElement: HTMLMediaElement) {
		this.element = mediaElement

		this.innerState = {
			isUserWantsToPlay: false,
			isPlaying: false,

			currentEntryDuration: 0,
			currentEntryPosition: 0,
			currentEntryIndex: 0,

			entries: [],

			isEntryEnded: false,
			isEnded: false,
			isSeeking: false,
			isSeekable: false,
			isBuffering: false,
			isReadyToPlay: false,

			loadingError: null,
			mediaError: null,

			error: null,

			speed: 1,
			volume: 1,
			preservePitchForSpeed: true,
			isPositionUpdatedAfterSeek: true,
		}
		this.innerPlayerBus = new DefaultEventBus<PlayerEvent>()
		this.innerStateBus = new DefaultStickyEventBus(this.innerState)

		// Register event listeners and store them
		this.eventListeners.push(["timeupdate", this.updateStateFromMedia])
		this.element.addEventListener("timeupdate", this.updateStateFromMedia)

		this.eventListeners.push(["ended", this.updateStateFromMedia])
		this.element.addEventListener("ended", this.updateStateFromMedia)

		this.eventListeners.push(["error", this.handleMediaError])
		this.element.addEventListener("error", this.handleMediaError)

		this.eventListeners.push(["seeking", this.updateStateFromMedia])
		this.element.addEventListener("seeking", this.updateStateFromMedia)

		this.eventListeners.push(["seeked", this.updateStateFromMedia])
		this.element.addEventListener("seeked", this.updateStateFromMedia)

		this.eventListeners.push(["ended", this.handleEnded])
		this.element.addEventListener("ended", this.handleEnded)

		this.eventListeners.push(["volumechange", this.handleEnded])
		this.element.addEventListener("volumechange", this.handleEnded)

		this.eventListeners.push(["statechange", this.handleEnded])
		this.element.addEventListener("statechange", this.handleEnded)

		this.eventListeners.push(["pause", this.handlePause])
		this.element.addEventListener("pause", this.handlePause)

		this.eventListeners.push(["loadeddata", this.handleLoaded])
		this.element.addEventListener("loadeddata", this.handleLoaded)
	}

	get state() {
		return this.stateBus.lastEvent
	}

	get stateBus() {
		return SubscribableUtil.hideStickyEmitter(this.innerStateBus)
	}

	get eventBus() {
		return SubscribableUtil.hideEmitter(this.innerPlayerBus)
	}

	public readonly release = () => {
		this.element.pause()
		this.element.src = ""

		if (this.freeSourceCallback) {
			this.freeSourceCallback()
			this.freeSourceCallback = null
		}

		this.eventListeners.forEach(([event, callback]) => {
			this.element.removeEventListener(event, callback)
		})
		this.eventListeners.splice(0)
	}
	/**
	 * Private method to update the state.
	 * Accepts a callback that receives the mutable state to modify.
	 */
	private updateState = (updater: (state: PlayerState) => void) => {
		updater(this.innerState)

		this.innerPlayerBus.emitEvent({
			type: PlayerEventType.STATE_CHANGE,
			state: this.innerState,
		})
	}

	private readonly handleMediaError = (event: ErrorEvent) => {
		this.innerPlayerBus.emitEvent({
			type: PlayerEventType.ERROR,
			error: event.error,
		})
		this.updateStateFromMedia()
	}

	private readonly handleEnded = () => {
		this.innerPlayerBus.emitEvent({
			type: PlayerEventType.ENTRY_ENDED,
		})
		this.updateStateFromMedia()
	}

	private readonly handleLoaded = () => {
		this.updateStateFromMedia()
	}

	private readonly handlePause = () => {
		if (
			!this.element.error &&
			this.innerState.isUserWantsToPlay &&
			this.innerState.entries[this.innerState.currentEntryIndex]
		) {
			this.innerPlayerBus.emitEvent({
				type: PlayerEventType.EXTERNAL_IS_PLAYING_CHANGE,
			})
		}
		this.updateStateFromMedia()
	}

	private updateStateFromMedia = () => {
		const mediaState: HtmlMediaElementState = getHtmlMediaElementState(
			this.element,
		)

		// Check if current entry is ended, and if so, update isEntryEnded and isEnded flags
		const isEntryEnded = mediaState.isEnded
		const isEnded =
			(isEntryEnded ||
				!this.innerState.entries[this.innerState.currentEntryIndex]) &&
			this.innerState.currentEntryIndex >=
				this.innerState.entries.length - 1

		this.updateState((state) => {
			state.currentEntryDuration = mediaState.currentEntryDuration
			state.currentEntryPosition = mediaState.currentEntryPosition
			state.isEntryEnded = isEntryEnded
			state.isEnded = isEnded
			state.isPlaying = mediaState.isPlaying
			state.speed = mediaState.speed
			state.volume = mediaState.volume
			state.preservePitchForSpeed = mediaState.preservePitchForSpeed
			state.error = !state.entries[state.currentEntryIndex]
				? null
				: mediaState.error
			state.isSeeking = mediaState.isSeeking
			state.isSeekable = mediaState.isSeekable
			state.isBuffering = mediaState.isBuffering
			state.isReadyToPlay =
				!!state.entries[state.currentEntryIndex] &&
				mediaState.isReadyToPlay

			if (this.afterLoadSeekTarget) {
				if (mediaState.isSeekable) {
					if (
						this.afterLoadSeekTarget !==
						mediaState.currentEntryPosition
					) {
						this.element.currentTime = this.afterLoadSeekTarget
						this.lastPositionLoadSeekStarted =
							mediaState.currentEntryPosition
					}

					this.afterLoadSeekTarget = 0
				}
			} else {
				if (
					mediaState.currentEntryPosition >= 0 &&
					!mediaState.isSeeking &&
					mediaState.currentEntryPosition !==
						this.lastPositionLoadSeekStarted
				) {
					state.isPositionUpdatedAfterSeek = true
				}
			}
		})

		if (
			this.innerState.entries[this.innerState.currentEntryIndex] &&
			mediaState.isPlayable &&
			mediaState.isPlaying !== this.innerState.isUserWantsToPlay
		) {
			this.synchronizePlayingState()
		}
	}

	public readonly forceLoadPlayerState = () => {
		this.updateStateFromMedia()
	}

	/**
	 * Enters debug mode by causing element to run muted.
	 */
	enterDebugMode = () => {
		this.element.muted = true
	}

	setUserWantsToPlay(isUserWantsToPlay: boolean) {
		this.updateState((state) => {
			state.isUserWantsToPlay = isUserWantsToPlay
		})
		this.synchronizePlayingState()
	}

	seek = (position: number, targetEntryIndex?: number) => {
		if (targetEntryIndex !== undefined) {
			if (targetEntryIndex !== this.innerState.currentEntryIndex) {
				this.updateState((state) => {
					state.currentEntryIndex = targetEntryIndex
				})
				const entry = this.innerState.entries[targetEntryIndex]
				this.loadEntry(entry ?? null, position)
			} else {
				this.updateState((state) => {
					state.isPositionUpdatedAfterSeek = false
				})
				this.element.currentTime = position
			}
		} else {
			this.updateState((state) => {
				state.isPositionUpdatedAfterSeek = false
			})
			this.element.currentTime = position
		}
	}

	setSpeed = (speed: number) => {
		this.element.playbackRate = speed
		this.updateState((state) => {
			state.speed = speed
		})
	}

	setVolume = (volume: number) => {
		this.element.volume = volume
		this.updateState((state) => {
			state.volume = volume
		})
	}

	setPreservePitchForSpeed = (preservePitchForSpeed: boolean) => {
		if ("preservesPitch" in this.element) {
			this.element.preservesPitch = preservePitchForSpeed
		}
		this.updateState((state) => {
			state.preservePitchForSpeed = preservePitchForSpeed
		})
	}

	setEntries = (entries: PlayerEntry[]) => {
		this.updateState((state) => {
			state.entries = entries
		})
		this.loadEntry(
			this.innerState.entries[this.innerState.currentEntryIndex] ?? null,
		)
	}

	reloadEntry = () => {
		const entry = this.innerState.entries[this.innerState.currentEntryIndex]
		this.loadEntry(entry ?? null)
	}

	private readonly synchronizePlayingState = () => {
		if (!this.afterLoadSeekTarget) {
			this.setElementPlaying(
				!!(
					!this.innerState.isEntryEnded && // Required, since play when ended in chrome causes item to be played once more from the start
					this.innerState.isUserWantsToPlay && // Don't play when user does not want to play
					this.innerState.entries[this.innerState.currentEntryIndex] // Do not play when no source
				),
			)
		}
	}

	private readonly setElementPlaying = (play: boolean) => {
		if (play) {
			this.element.play().catch(() => {
				// ignore
			})
		} else {
			this.element.pause()
		}
	}

	private readonly enqueueSeekAfterLoad = (targetPosition: number) => {
		this.afterLoadSeekTarget = targetPosition
		this.updateState((state) => {
			state.isPositionUpdatedAfterSeek = false
		})
	}

	private readonly loadEntry = (
		entry: PlayerEntry | null,
		targetPosition = 0,
	) => {
		if (this.freeSourceCallback) {
			this.freeSourceCallback()
			this.freeSourceCallback = null
		}

		this.afterLoadSeekTarget = 0

		if (entry) {
			if (entry.type === PlayerEntryType.URL) {
				this.element.src = entry.url
				try {
					this.element.load()
				} catch (_e) {
					// ignore
				}
			} else if (entry.type === PlayerEntryType.BLOB) {
				const url = URL.createObjectURL(entry.blob)
				this.freeSourceCallback = () => {
					URL.revokeObjectURL(url)
				}

				this.element.src = url
				try {
					this.element.load()
				} catch (_e) {
					// ignore
				}
			}

			if (targetPosition > 0) {
				// Make sure it's paused, so we won't start playing
				//  for short bit until after seek is done
				this.setElementPlaying(false)
				this.enqueueSeekAfterLoad(targetPosition)
			} else {
				this.synchronizePlayingState()
			}
		} else {
			this.setElementPlaying(false)
			this.element.src = ""
		}
	}
}
