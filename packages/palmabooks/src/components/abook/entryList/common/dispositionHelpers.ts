import { AbookEntryDisposition } from "@teawithsand/booklibr"
import { AppTransString } from "../../../../trans/appTranslation"

export const getDispositionColor = (
	disposition: AbookEntryDisposition,
): string => {
	switch (disposition) {
		case AbookEntryDisposition.PLAYABLE_AUDIO:
			return "blue"
		case AbookEntryDisposition.COVER_IMAGE:
			return "green"
		default:
			return "gray"
	}
}

export const getDispositionTransString = (
	disposition: AbookEntryDisposition,
): AppTransString => {
	switch (disposition) {
		case AbookEntryDisposition.PLAYABLE_AUDIO:
			return (t) => t.entryList.disposition.labels.playableAudio
		case AbookEntryDisposition.COVER_IMAGE:
			return (t) => t.entryList.disposition.labels.coverImage
		default:
			// Handle any other values that might be added in the future
			return () => String(disposition)
	}
}

export const getDispositionLabel = (
	disposition: AbookEntryDisposition,
	resolve: (trans: AppTransString) => string,
): string => {
	return resolve(getDispositionTransString(disposition))
}

export const createDispositionOptions = (
	resolve: (trans: AppTransString) => string,
) =>
	Object.values(AbookEntryDisposition).map((disposition) => ({
		value: disposition,
		label: getDispositionLabel(disposition, resolve),
	}))
