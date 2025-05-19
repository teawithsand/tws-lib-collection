import { describe, expect, test } from "vitest"
import { SdelkaCardState } from "../../sdelkaCardState"
import { SdelkaCardQueue } from "../../sdelkaQueue"
import { StoredSdelkaCardState } from "./schema"
import { StoredSdelkaCardQueueV1 } from "./schemaV1"
import { SdelkaCardStateSerializer } from "./serializer"

describe("SdelkaCardStateSerializer", () => {
	const exampleStateBase: Omit<SdelkaCardState, "fsrs"> & {
		fsrs: Omit<SdelkaCardState["fsrs"], "state">
	} = {
		fsrs: {
			dueTimestamp: 1234567890,
			stability: 0.8,
			difficulty: 0.5,
			elapsedDays: 10,
			scheduledDays: 5,
			reps: 20,
			lapses: 2,
			lastReviewTimestamp: 1234560000,
		},
	}

	const statesToTest = [
		SdelkaCardQueue.NEW,
		SdelkaCardQueue.LEARNING,
		SdelkaCardQueue.LEARNED,
		SdelkaCardQueue.RELEARNING,
	]

	statesToTest.forEach((state) => {
		test(`serialize and deserialize with state ${StoredSdelkaCardQueueV1[state]} (${state})`, () => {
			const exampleState = {
				...exampleStateBase,
				fsrs: {
					...exampleStateBase.fsrs,
					state,
				},
			}
			const serialized = SdelkaCardStateSerializer.serialize(exampleState)
			expect(serialized.data.fsrs.state).toBe(state)
			const deserialized =
				SdelkaCardStateSerializer.deserialize(serialized)
			expect(deserialized.fsrs.state).toBe(exampleState.fsrs.state)
			expect(deserialized).toEqual(exampleState)
		})
	})

	const exampleState: SdelkaCardState = {
		fsrs: {
			dueTimestamp: 1234567890,
			stability: 0.8,
			difficulty: 0.5,
			elapsedDays: 10,
			scheduledDays: 5,
			reps: 20,
			lapses: 2,
			state: SdelkaCardQueue.LEARNING,
			lastReviewTimestamp: 1234560000,
		},
	}

	test("serialize returns correct StoredSdelkaCardState with version 1", () => {
		const serialized = SdelkaCardStateSerializer.serialize(exampleState)
		expect(serialized.version).toBe(1)
		expect(serialized.data.fsrs.dueTimestamp).toBe(
			exampleState.fsrs.dueTimestamp,
		)
		expect(serialized.data.fsrs.stability).toBe(exampleState.fsrs.stability)
		expect(serialized.data.fsrs.difficulty).toBe(
			exampleState.fsrs.difficulty,
		)
		expect(serialized.data.fsrs.elapsedDays).toBe(
			exampleState.fsrs.elapsedDays,
		)
		expect(serialized.data.fsrs.scheduledDays).toBe(
			exampleState.fsrs.scheduledDays,
		)
		expect(serialized.data.fsrs.reps).toBe(exampleState.fsrs.reps)
		expect(serialized.data.fsrs.lapses).toBe(exampleState.fsrs.lapses)
		expect(serialized.data.fsrs.state).toBe(1)
		expect(serialized.data.fsrs.lastReviewTimestamp).toBe(
			exampleState.fsrs.lastReviewTimestamp,
		)
	})

	test("serialize and then deserialize should not change the state", () => {
		const serialized = SdelkaCardStateSerializer.serialize(exampleState)
		const deserialized = SdelkaCardStateSerializer.deserialize(serialized)
		expect(deserialized).toEqual(exampleState)
	})

	test("deserialize returns correct SdelkaCardState from StoredSdelkaCardState", () => {
		const stored: StoredSdelkaCardState = {
			version: 1,
			data: {
				fsrs: {
					dueTimestamp: 1234567890,
					stability: 0.8,
					difficulty: 0.5,
					elapsedDays: 10,
					scheduledDays: 5,
					reps: 20,
					lapses: 2,
					state: 1,
					lastReviewTimestamp: 1234560000,
				},
			},
		}
		const deserialized = SdelkaCardStateSerializer.deserialize(stored)
		expect(deserialized.fsrs.dueTimestamp).toBe(
			stored.data.fsrs.dueTimestamp,
		)
		expect(deserialized.fsrs.stability).toBe(stored.data.fsrs.stability)
		expect(deserialized.fsrs.difficulty).toBe(stored.data.fsrs.difficulty)
		expect(deserialized.fsrs.elapsedDays).toBe(stored.data.fsrs.elapsedDays)
		expect(deserialized.fsrs.scheduledDays).toBe(
			stored.data.fsrs.scheduledDays,
		)
		expect(deserialized.fsrs.reps).toBe(stored.data.fsrs.reps)
		expect(deserialized.fsrs.lapses).toBe(stored.data.fsrs.lapses)
		expect(deserialized.fsrs.state).toBe(SdelkaCardQueue.LEARNING)
		expect(deserialized.fsrs.lastReviewTimestamp).toBe(
			stored.data.fsrs.lastReviewTimestamp,
		)
	})

	test("deserialize and then serialize should not change the stored state", () => {
		const stored: StoredSdelkaCardState = {
			version: 1,
			data: {
				fsrs: {
					dueTimestamp: 1234567890,
					stability: 0.8,
					difficulty: 0.5,
					elapsedDays: 10,
					scheduledDays: 5,
					reps: 20,
					lapses: 2,
					state: 1,
					lastReviewTimestamp: 1234560000,
				},
			},
		}
		const deserialized = SdelkaCardStateSerializer.deserialize(stored)
		const reStored = SdelkaCardStateSerializer.serialize(deserialized)
		expect(reStored).toEqual(stored)
	})

	test("serialize snapshot", () => {
		const serialized = SdelkaCardStateSerializer.serialize(exampleState)
		expect(serialized).toMatchSnapshot()
	})

	test("deserialize snapshot", () => {
		const stored: StoredSdelkaCardState = {
			version: 1,
			data: {
				fsrs: {
					dueTimestamp: 1234567890,
					stability: 0.8,
					difficulty: 0.5,
					elapsedDays: 10,
					scheduledDays: 5,
					reps: 20,
					lapses: 2,
					state: 1,
					lastReviewTimestamp: 1234560000,
				},
			},
		}
		const deserialized = SdelkaCardStateSerializer.deserialize(stored)
		expect(deserialized).toMatchSnapshot()
	})
})
