import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { MintayDrizzleDB } from "../db/db"
import { getTestingDb } from "../db/dbTest.test"
import { MintayCollectionDataUtil } from "../defines/card"
import { Mintay } from "./defines"
import { DrizzleMintay } from "./drizzle"
import { InMemoryMintay } from "./inMemory"

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
