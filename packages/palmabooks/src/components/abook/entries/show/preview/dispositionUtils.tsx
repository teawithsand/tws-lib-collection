import {
	IconFileMusic,
	IconFileText,
	IconPhoto,
	IconQuestionMark,
} from "@tabler/icons-react"
import { AbookEntryDisposition } from "@teawithsand/booklibr"
import { ReactNode } from "react"

export const getDispositionIcon = (
	disposition: AbookEntryDisposition,
): ReactNode => {
	switch (disposition) {
		case AbookEntryDisposition.PLAYABLE_AUDIO:
			return <IconFileMusic size={24} />
		case AbookEntryDisposition.COVER_IMAGE:
			return <IconPhoto size={24} />
		case AbookEntryDisposition.DESCRIPTION:
			return <IconFileText size={24} />
		case AbookEntryDisposition.UNKNOWN:
		default:
			return <IconQuestionMark size={24} />
	}
}

export const getDispositionColor = (
	disposition: AbookEntryDisposition,
): string => {
	switch (disposition) {
		case AbookEntryDisposition.PLAYABLE_AUDIO:
			return "blue"
		case AbookEntryDisposition.COVER_IMAGE:
			return "grape"
		case AbookEntryDisposition.DESCRIPTION:
			return "cyan"
		case AbookEntryDisposition.UNKNOWN:
		default:
			return "gray"
	}
}
