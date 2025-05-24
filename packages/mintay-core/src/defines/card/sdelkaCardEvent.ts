import { MintayAnswer } from "./answer"

export enum MintayCardEventType {
	ANSWER = 0,
}

export type MintayCardEvent = {
	type: MintayCardEventType.ANSWER
	answer: MintayAnswer
	timestamp: number
}
