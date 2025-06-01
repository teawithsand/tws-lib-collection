import { eq } from "drizzle-orm"
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest"
import { MintayDrizzleDB } from "../db/db"
import { getTestingDb } from "../db/dbTest.test"
import { cardsTable } from "../db/schema"
import {
	MintayAnswer,
	MintayCardDataUtil,
	MintayCardEventType,
	MintayCollectionDataUtil,
} from "../defines/card"
import { CardId, CardIdUtil } from "../defines/typings/cardId"
import { FsrsParameters } from "../fsrs"
import { Mintay } from "./defines"
import { DrizzleMintay } from "./drizzle"
import { InMemoryMintay } from "./inMemory"

const testParameters: FsrsParameters = {
	requestRetention: 0.9,
	maximumInterval: 36500,
	w: [
		0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18,
		0.05, 0.34, 1.26, 0.29, 2.61, 0.29, 2.61,
	],
	enableFuzz: false,
	enableShortTerm: true,
}

describe.each<{
	name: string
	getMintay: () => Promise<{ mintay: Mintay; cleanup?: () => Promise<void> }>
}>([
	{
		name: "InMemoryMintay",
		getMintay: async () => ({ mintay: new InMemoryMintay() }),
	},
	{
		name: "DrizzleMintay",
		getMintay: async () => {
			const { drizzle, close } = await getTestingDb()
			return {
				mintay: new DrizzleMintay({ db: drizzle as MintayDrizzleDB }),
				cleanup: close,
			}
		},
	},
])("Mintay E2E Tests - $name", ({ getMintay }) => {
	let mintay: Mintay
	let cleanup: (() => Promise<void>) | undefined

	beforeAll(async () => {
		const res = await getMintay()
		mintay = res.mintay
		cleanup = res.cleanup
	})

	afterAll(async () => {
		if (cleanup) {
			await cleanup()
		}
	})

	test("should create a collection successfully", async () => {
		const collectionHandle = await mintay.collectionStore.create()

		expect(collectionHandle).toBeDefined()
		expect(collectionHandle.id).toBeDefined()

		const exists = await collectionHandle.exists()
		expect(exists).toBe(true)

		const collectionData = await collectionHandle.read()
		expect(collectionData).toEqual(
			MintayCollectionDataUtil.getDefaultData(),
		)
	})
})
