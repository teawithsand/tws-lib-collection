import { SdelkaCardQueue } from "./sdelkaQueue"

export type SdelkaCardStateFSRS = {
	dueTimestamp: number
	stability: number
	difficulty: number
	elapsedDays: number
	scheduledDays: number
	reps: number
	lapses: number
	state: SdelkaCardQueue
	lastReviewTimestamp: number | null
}

export type SdelkaCardState = {
	fsrs: SdelkaCardStateFSRS
}
