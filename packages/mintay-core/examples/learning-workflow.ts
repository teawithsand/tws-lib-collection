/**
 * Learning Workflow Example
 *
 * Demonstrates creating collections, cards, and using the FSRS learning engine.
 */
import {
	FsrsParameters,
	MintayAnswer,
	MintayCardEventType,
	MintayCardQueue,
} from "../src"
import { mintay } from "./basic-setup"

const run = async (): Promise<void> => {
	// 1. Create a collection
	const collection = await mintay.collectionStore.create()
	await collection.save({
		globalId: "vocab-french",
		name: "French Vocabulary",
	})

	// 2. Create a card
	const card = await collection.createCard()
	await card.save({
		globalId: "card-001",
		question: "What is 'hello' in French?",
		answer: "Bonjour",
		discoveryPriority: 100,
	})

	// 3. Set up the engine store with FSRS parameters
	const fsrsParams: FsrsParameters = {
		requestRetention: 0.9,
		maximumInterval: 36500,
		w: [
			0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18,
			0.05, 0.34, 1.26, 0.29, 2.61, 0.2, 1.0,
		],
		enableFuzz: true,
		enableShortTerm: true,
	}
	const engineStore = mintay.getEngineStore(collection.id, fsrsParams)

	// 4. Get the next card to study
	const topCardId = await engineStore.getTopCard()
	console.log("Next card to study:", topCardId)

	// 5. Check initial card state
	const initialState = await engineStore.getCardData(card.id)
	console.log("Initial state:", {
		queue: MintayCardQueue[initialState.fsrs.state],
		reps: initialState.fsrs.reps,
	})

	// 6. Answer the card
	await engineStore.push(card.id, {
		type: MintayCardEventType.ANSWER,
		answer: MintayAnswer.GOOD,
		timestamp: Date.now(),
	})

	// 7. Check updated state
	const updatedState = await engineStore.getCardData(card.id)
	console.log("After answering GOOD:", {
		queue: MintayCardQueue[updatedState.fsrs.state],
		reps: updatedState.fsrs.reps,
	})

	// 8. Undo the last answer
	await engineStore.popCard(card.id)
	const afterUndo = await engineStore.getCardData(card.id)
	console.log("After undo:", {
		queue: MintayCardQueue[afterUndo.fsrs.state],
		reps: afterUndo.fsrs.reps,
	})
}

run().catch(console.error)
