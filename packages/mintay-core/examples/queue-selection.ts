/**
 * Queue-Based Card Selection Example
 *
 * Demonstrates filtering cards by queue type (NEW, LEARNING, LEARNED, RELEARNING).
 */
import { FsrsParameters, MintayCardQueue } from "../src"
import { mintay } from "./basic-setup"

const run = async (): Promise<void> => {
	// Create collection with multiple cards
	const collection = await mintay.collectionStore.create()
	await collection.save({ globalId: "queue-demo", name: "Queue Demo" })

	// Create cards
	for (let i = 1; i <= 3; i++) {
		const card = await collection.createCard()
		await card.save({
			globalId: `card-${i}`,
			question: `Question ${i}`,
			answer: `Answer ${i}`,
			discoveryPriority: i * 100,
		})
	}

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

	// Get only NEW cards
	const newCard = await engineStore.getTopCard([MintayCardQueue.NEW])
	console.log("Top NEW card:", newCard)

	// Get cards from multiple queues
	const learningOrRelearning = await engineStore.getTopCard([
		MintayCardQueue.LEARNING,
		MintayCardQueue.RELEARNING,
	])
	console.log("Top LEARNING/RELEARNING card:", learningOrRelearning)

	// Get from any queue (no filter)
	const anyCard = await engineStore.getTopCard()
	console.log("Top card (any queue):", anyCard)
}

run().catch(console.error)
