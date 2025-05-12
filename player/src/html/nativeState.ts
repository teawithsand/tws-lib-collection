export enum HtmlMediaReadyState {
	HAVE_NOTHING = 0, // No information is available about the media resource.
	HAVE_METADATA = 1, // Metadata for the media resource is available.
	HAVE_CURRENT_DATA = 2, // Data for the current playback position is available, but not enough to play next frame.
	HAVE_FUTURE_DATA = 3, // Data for the current and at least the next frame is available.
	HAVE_ENOUGH_DATA = 4, // Enough data available to start playing.
}

export enum HtmlMediaNetworkState {
	NETWORK_EMPTY = 0, // Audio/Video has not yet been initialized.
	NETWORK_IDLE = 1, // Audio/Video is active and has selected a resource, but is not using the network.
	NETWORK_LOADING = 2, // Browser is downloading the media data.
	NETWORK_NO_SOURCE = 3, // No media source found.
}

export interface HtmlMediaElementState {
	isPlaying: boolean

	currentEntryDuration: number
	currentEntryPosition: number

	isEnded: boolean
	isSeeking: boolean

	isSeekable: boolean
	isPlayable: boolean
	isBuffering: boolean
	isReadyToPlay: boolean

	error: any | null
	speed: number
	volume: number
	preservePitchForSpeed: boolean

	readyState: HtmlMediaReadyState
	networkState: HtmlMediaNetworkState
}

export function getHtmlMediaElementState(
	media: HTMLMediaElement | HTMLAudioElement | HTMLVideoElement,
): HtmlMediaElementState {
	const readyState = media.readyState as HtmlMediaReadyState
	const networkState = media.networkState as HtmlMediaNetworkState

	const isSeekable =
		media.seekable.length > 0 &&
		isFinite(media.duration) &&
		media.duration > 0

	// Check if media is playable - enough data to play and no fatal network errors
	const isPlayable =
		readyState >= HtmlMediaReadyState.HAVE_ENOUGH_DATA &&
		networkState !== HtmlMediaNetworkState.NETWORK_NO_SOURCE &&
		!media.error

	const isBuffering =
		(networkState === HtmlMediaNetworkState.NETWORK_LOADING ||
			readyState < HtmlMediaReadyState.HAVE_ENOUGH_DATA) &&
		!media.ended &&
		!media.paused

	const isReadyToPlay =
		readyState >= HtmlMediaReadyState.HAVE_ENOUGH_DATA &&
		networkState !== HtmlMediaNetworkState.NETWORK_NO_SOURCE &&
		!media.error

	return {
		isPlaying:
			!media.paused &&
			!media.ended &&
			readyState > HtmlMediaReadyState.HAVE_CURRENT_DATA,

		currentEntryDuration: media.duration ?? -1,
		currentEntryPosition: media.currentTime ?? -1,

		isEnded: media.ended,
		isSeeking: media.seeking,

		isReadyToPlay,
		isPlayable,
		isSeekable,
		isBuffering,

		error: media.error
			? {
					code: media.error.code,
					message: media.error.message || null,
				}
			: null,

		speed: media.playbackRate,
		volume: media.volume,
		preservePitchForSpeed:
			media.preservesPitch !== undefined ? media.preservesPitch : true,

		readyState,
		networkState,
	}
}
