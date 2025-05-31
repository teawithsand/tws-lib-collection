import { describe, expect, test } from "vitest"
import { FsrsParameters } from "../../fsrs/params"
import { MintayAnswer } from "../card"
import { MintayCardEvent, MintayCardEventType } from "../card/cardEvent"
import { MintayCardStateExtractor } from "../card/extractor"
import { MintayCardQueue } from "../card/queue"
import { MintayCardStateReducer } from "./mintay"

describe("MintayCardStateReducer", () => {
	const defaultParams: FsrsParameters = {
		requestRetention: 0.9,
		maximumInterval: 36500,
		w: [
			0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18,
			0.05, 0.34, 1.26, 0.29, 2.61,
		],
		enableFuzz: false, // Added missing required property
		enableShortTerm: true, // Added missing required property
	}
	const reducer = new MintayCardStateReducer(defaultParams)
	const extractor = new MintayCardStateExtractor()

	test("fold should update card state based on an event", () => {
		const initialState = reducer.getDefaultState()
		const timestamp = initialState.fsrs.dueTimestamp + 24 * 60 * 60 * 1000 // 1 day after due

		const event: MintayCardEvent = {
			type: MintayCardEventType.ANSWER,
			answer: MintayAnswer.GOOD,
			timestamp,
		}

		const nextState = reducer.fold(initialState, event)

		expect(nextState.fsrs.state).toBe(MintayCardQueue.LEARNING) // Or REVIEW, FSRS specific
		expect(nextState.fsrs.reps).toBe(1)
		expect(nextState.fsrs.lapses).toBe(0)
		expect(nextState.fsrs.lastReviewTimestamp).toBe(timestamp)
		expect(nextState.fsrs.dueTimestamp).toBeGreaterThan(timestamp)

		expect(extractor.getQueue(nextState)).not.toBe(MintayCardQueue.NEW)
		expect(extractor.getPriority(nextState)).toBe(
			nextState.fsrs.dueTimestamp,
		)
		expect(extractor.getStats(nextState)).toEqual({
			repeats: 1,
			lapses: 0,
		})
	})

	test("getPossibleStates should return a map of states for all possible answers", () => {
		const initialState = reducer.getDefaultState() // This is a new card
		const timestamp =
			initialState.fsrs.dueTimestamp + 2 * 24 * 60 * 60 * 1000 // 2 days after due

		const possibleStatesMap = reducer.getPossibleStates(
			initialState,
			timestamp,
		)

		expect(possibleStatesMap.size).toBe(4)

		const answers = [
			MintayAnswer.AGAIN,
			MintayAnswer.HARD,
			MintayAnswer.GOOD,
			MintayAnswer.EASY,
		]

		for (const answer of answers) {
			expect(possibleStatesMap.has(answer)).toBe(true)
			const nextState = possibleStatesMap.get(answer)!

			expect(nextState).toBeDefined()
			expect(nextState.fsrs.reps).toBe(1)
			expect(nextState.fsrs.lastReviewTimestamp).toBe(timestamp)
			expect(nextState.fsrs.dueTimestamp).toBeGreaterThanOrEqual(
				timestamp,
			)

			if (answer === MintayAnswer.AGAIN) {
				// For a new card (initialState), the first "AGAIN" should not count as a lapse.
				expect(nextState.fsrs.lapses).toBe(0)
				expect(extractor.getQueue(nextState)).toBe(
					MintayCardQueue.LEARNING,
				) // Or RELEARNING
			} else {
				// For other answers on a new card, lapses should also be 0.
				expect(nextState.fsrs.lapses).toBe(0)
			}

			expect(extractor.getStats(nextState).repeats).toBe(1)
		}

		const goodState = possibleStatesMap.get(MintayAnswer.GOOD)!
		expect(extractor.getQueue(goodState)).toBe(MintayCardQueue.LEARNING) // Or REVIEW

		const againState = possibleStatesMap.get(MintayAnswer.AGAIN)!
		// For a new card (initialState), the first "AGAIN" should not count as a lapse.
		expect(extractor.getStats(againState).lapses).toBe(0)
	})

	test("good answer should eventually lead to a learned card", () => {
		const extractor = new MintayCardStateExtractor()
		let currentState = reducer.getDefaultState()
		for (let i = 0; i < 10; i++) {
			const goodEvent: MintayCardEvent = {
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.GOOD,
				timestamp: 1234,
			}
			currentState = reducer.fold(currentState, goodEvent)
			if (extractor.getQueue(currentState) === MintayCardQueue.LEARNED) {
				break
			}
		}

		expect(extractor.getQueue(currentState)).toBe(MintayCardQueue.LEARNED)
	})

	test("fold should correctly increment lapses when a learned card is answered AGAIN", () => {
		const extractor = new MintayCardStateExtractor()
		let currentState = reducer.getDefaultState()
		for (let i = 0; i < 10; i++) {
			const goodEvent: MintayCardEvent = {
				type: MintayCardEventType.ANSWER,
				answer: MintayAnswer.GOOD,
				timestamp: 1234,
			}
			currentState = reducer.fold(currentState, goodEvent)
			if (extractor.getQueue(currentState) === MintayCardQueue.LEARNED) {
				break
			}
		}

		currentState = reducer.fold(currentState, {
			type: MintayCardEventType.ANSWER,
			answer: MintayAnswer.AGAIN,
			timestamp: 1234,
		})

		expect(extractor.getQueue(currentState)).toBe(
			MintayCardQueue.RELEARNING,
		)
		expect(extractor.getStats(currentState).lapses).toBe(1)
	})

	test("getDefaultState returns consistent values", async () => {
		const reducer = new MintayCardStateReducer(defaultParams)

		const state1 = reducer.getDefaultState()

		// Introduce a delay
		await new Promise((resolve) => setTimeout(resolve, 400))

		const state2 = reducer.getDefaultState()

		expect(state1).toEqual(state2)
	})
})
