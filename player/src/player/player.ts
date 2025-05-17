import { PlayerEntry } from "./entry"

export interface PlayerState {
	isUserWantsToPlay: boolean
	isPlaying: boolean

	currentEntryDuration: number
	currentEntryPosition: number
	currentEntryIndex: number

	entries: PlayerEntry[]

	isEntryEnded: boolean
	isEnded: boolean
	isSeeking: boolean
	isSeekable: boolean
	isBuffering: boolean
	isReadyToPlay: boolean

	loadingError: any | null
	mediaError: any | null

	error: any | null

	speed: number
	volume: number
	preservePitchForSpeed: boolean

	isPositionUpdatedAfterSeek: boolean
}

export enum PlayerEventType {
	STATE_CHANGE = "state-change",
	ENTRY_ENDED = "entry-ended",
	ERROR = "error",
	EXTERNAL_IS_PLAYING_CHANGE = "external-is-playing-change",
}

export type PlayerEvent =
	| {
			type: PlayerEventType.ERROR
			error: any
	  }
	| {
			type: PlayerEventType.ENTRY_ENDED
	  }
	| {
			type: PlayerEventType.EXTERNAL_IS_PLAYING_CHANGE
	  }
	| {
			state: Readonly<PlayerState>
			type: PlayerEventType.STATE_CHANGE
	  }

export type PlayerEventTypes = {
	[PlayerEventType.ERROR]: Extract<
		PlayerEvent,
		{ type: PlayerEventType.ERROR }
	>
	[PlayerEventType.ENTRY_ENDED]: Extract<
		PlayerEvent,
		{ type: PlayerEventType.ENTRY_ENDED }
	>
	[PlayerEventType.EXTERNAL_IS_PLAYING_CHANGE]: Extract<
		PlayerEvent,
		{ type: PlayerEventType.EXTERNAL_IS_PLAYING_CHANGE }
	>
	[PlayerEventType.STATE_CHANGE]: Extract<
		PlayerEvent,
		{ type: PlayerEventType.STATE_CHANGE }
	>
}

export interface Player {
	readonly state: Readonly<PlayerState>

	on: <K extends keyof PlayerEventTypes>(
		event: K,
		callback: (e: PlayerEventTypes[K]) => void,
	) => void

	off: <K extends keyof PlayerEventTypes>(
		event: K,
		callback: (e: PlayerEventTypes[K]) => void,
	) => void

	setUserWantsToPlay: (isUserWantsToPlay: boolean) => void
	seek: (position: number, targetEntryIndex?: number) => void
	setSpeed: (speed: number) => void
	setVolume: (volume: number) => void
	setPreservePitchForSpeed: (preservePitchForSpeed: boolean) => void

	setEntries: (entries: PlayerEntry[]) => void
	reloadEntry: () => void
}
