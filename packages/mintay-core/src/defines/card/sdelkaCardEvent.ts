import { SdelkaAnswer } from "./answer"

export enum SdelkaCardEventType {
	ANSWER = 0,
}

export type SdelkaCardEvent = {
	type: SdelkaCardEventType.ANSWER
	answer: SdelkaAnswer
	timestamp: number
}
