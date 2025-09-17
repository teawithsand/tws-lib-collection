import { DeepEqualComparator, Timestamp } from "@teawithsand/lngext"
import { SimpleSerializedError } from "@teawithsand/reserd"
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	test,
	vi,
	type MockInstance,
} from "vitest"
import {
	AbookAggregateData,
	AbookData,
	AbookEntryAggregateData,
	AbookEntryData,
	AbookEntryDisposition,
	AbookEntrySourceType,
	AbookEntrySourceUtil,
	AbookHeaderData,
	BlobMetadataResultType,
} from "../../defines"
import { AbookAggregatorImpl } from "../aggregate"
import {
	AbookEntryBlobNotFoundError,
	AbookEntryNotFoundError,
	AbookNotFoundError,
	AbookStore,
	AbookWriteAggregateType,
} from "../defines"
import { AbookHandle } from "../defines/abookHandle"
import { AbookEntryAggregator, AbookEntryHandle } from "../defines/entryHandle"
import { createTestStore, StoreType, TestAbookStore } from "./testingSetup"

const fsTypes = [StoreType.IN_MEMORY, StoreType.FS]

const mockAbookEntryAggregator: AbookEntryAggregator = {
	aggregate: vi.fn(
		async (
			data: AbookEntryData,
			blob: Blob,
		): Promise<AbookEntryAggregateData> => ({
			metadata: {
				extractSource: AbookEntrySourceUtil.toLite(data.source),
				extractTimestamp: Timestamp.fromNumber(12345),
				metadata: {
					audio: {
						type: BlobMetadataResultType.SUCCESS,
						metadata: {
							duration: blob.size ?? 0,
						},
					},
					image: {
						type: BlobMetadataResultType.ERROR,
						error: SimpleSerializedError.fromAny("asdf"),
					},
				},
			},
			blobSize: blob.size ?? 0,
		}),
	),
}

const createDefaultHeaderData = (): AbookHeaderData => ({
	createdAt: Timestamp.fromDate(new Date()),
	metadata: {
		title: "Test Abook",
		description: "Test Description",
		privateUserNote: "Test Note",
	},
	position: null,
})

fsTypes.forEach((fsType) => {
	describe(`AbookStore tests - ${fsType}`, () => {
		let testStore: TestAbookStore
		let store: AbookStore
		let aggregateSpy: MockInstance<
			(data: AbookData) => Promise<AbookAggregateData>
		>
		beforeEach(async () => {
			vi.clearAllMocks()

			testStore = await createTestStore(fsType, {
				abookAggregator: AbookAggregatorImpl.create(),
				abookEntryAggregator: mockAbookEntryAggregator,
			})
			store = testStore.store
			aggregateSpy = vi.spyOn(testStore.abookAggregator, "aggregate")
		})

		afterEach(async () => {
			await testStore.release()
		})

		describe("createAbook", () => {
			test("should create a new abook", async () => {
				// Arrange
				// (store is already set up in beforeEach)

				// Act
				const handle = await store.createAbook(
					createDefaultHeaderData(),
				)
				const exists = await handle.exists()

				// Assert
				expect(handle).toBeDefined()
				expect(exists).toBe(true)
			})

			test("created abook should be in the list of abooks", async () => {
				// Arrange
				// (store is already set up in beforeEach)

				// Act
				const handle = await store.createAbook(
					createDefaultHeaderData(),
				)
				const abooks = await store.listAbooks()

				// Assert
				expect(abooks.map((a) => a.id)).toContain(handle.id)
			})
		})

		describe("listAbooks", () => {
			test("should return an empty array when no abooks are created", async () => {
				// Arrange
				// (store is already set up in beforeEach with no abooks)

				// Act
				const abooks = await store.listAbooks()

				// Assert
				expect(abooks).toEqual([])
			})

			test("should return all created abooks", async () => {
				// Arrange
				const handle1 = await store.createAbook(
					createDefaultHeaderData(),
				)
				const handle2 = await store.createAbook(
					createDefaultHeaderData(),
				)

				// Act
				const abooks = await store.listAbooks()

				// Assert
				expect(abooks.length).toBe(2)
				expect(abooks.map((a) => a.id).sort()).toEqual(
					[handle1.id, handle2.id].sort(),
				)
			})
		})

		describe("get", () => {
			test("should return handle for existing abook", async () => {
				// Arrange
				const createdHandle = await store.createAbook(
					createDefaultHeaderData(),
				)

				// Act
				const handle = await store.get(createdHandle.id)
				const exists = await handle.exists()

				// Assert
				expect(handle).toBeDefined()
				expect(handle.id).toBe(createdHandle.id)
				expect(exists).toBe(true)
			})

			test("should return non-existent handle for non-existent abook", async () => {
				// Arrange
				const nonExistentId = "non-existent-id"

				// Act
				const handle = await store.get(nonExistentId)
				const exists = await handle.exists()

				// Assert
				expect(handle).toBeDefined()
				expect(handle.id).toBe(nonExistentId)
				expect(exists).toBe(false)
			})

			test("should throw error when write is called on non-existent abook", async () => {
				// Arrange
				const nonExistentId = "new-abook-id"
				const headerData = createDefaultHeaderData()

				// Act & Assert
				const handle = await store.get(nonExistentId)
				const existsBefore = await handle.exists()
				expect(existsBefore).toBe(false)
				await expect(
					handle.write({ data: headerData }),
				).rejects.toThrow(AbookNotFoundError)
			})

			test("should throw error when write is called without data on non-existent abook", async () => {
				// Arrange
				const nonExistentId = "should-not-be-created"

				// Act & Assert
				const handle = await store.get(nonExistentId)
				const existsBefore = await handle.exists()
				expect(existsBefore).toBe(false)
				await expect(handle.write({})).rejects.toThrow(
					AbookNotFoundError,
				)
			})

			test("should allow write on existing abook", async () => {
				// Arrange
				const createdHandle = await store.createAbook(
					createDefaultHeaderData(),
				)
				const newHeaderData = createDefaultHeaderData()
				newHeaderData.metadata.title = "Updated Title"

				// Act & Assert
				await expect(
					createdHandle.write({ data: newHeaderData }),
				).resolves.not.toThrow()
				const abook = await createdHandle.mustRead()
				expect(abook.data.header.metadata.title).toBe("Updated Title")
			})

			test("should allow write with only aggregate options on existing abook", async () => {
				// Arrange
				const createdHandle = await store.createAbook(
					createDefaultHeaderData(),
				)

				// Act & Assert
				await expect(
					createdHandle.write({
						aggregate: {
							type: AbookWriteAggregateType.CLEAR,
						},
					}),
				).resolves.not.toThrow()
			})
		})

		describe("AbookHandle", () => {
			let handle: AbookHandle

			beforeEach(async () => {
				handle = await store.createAbook(createDefaultHeaderData())
				// Clear mock calls from setup - we only want to track calls made during the actual test
				vi.clearAllMocks()
			})

			describe("aggregate", () => {
				test("default aggregate data for abook is computed", async () => {
					// Assert
					const abook = await handle.mustRead()

					expect(abook.aggregate.totalEntries).toBe(0)
					expect(abook.aggregate.totalDurationMillis).toBe(0)
				})

				const sampleAbookAggregateDataOne: AbookAggregateData = {
					totalEntries: 4321,
					totalDurationMillis: 7654321,
				}

				test("set should set aggregate data for abook", async () => {
					// Act
					await handle.write({
						aggregate: {
							type: AbookWriteAggregateType.SET,
							data: sampleAbookAggregateDataOne,
						},
					})

					// Assert
					const updatedAbook = await handle.mustRead()
					expect(updatedAbook.aggregate.totalEntries).toBe(
						sampleAbookAggregateDataOne.totalEntries,
					)
					expect(updatedAbook.aggregate.totalDurationMillis).toBe(
						sampleAbookAggregateDataOne.totalDurationMillis,
					)
				})

				test("clear should clear aggregate data for abook", async () => {
					// Arrange
					await handle.write({
						aggregate: {
							type: AbookWriteAggregateType.SET,
							data: sampleAbookAggregateDataOne,
						},
					})

					// Act
					await handle.write({
						aggregate: {
							type: AbookWriteAggregateType.CLEAR,
						},
					})

					// Assert
					const updatedAbook = await handle.mustRead()
					expect(updatedAbook.aggregate.totalEntries).toEqual(-1)
					expect(updatedAbook.aggregate.totalDurationMillis).toEqual(
						-1,
					)
					expect(aggregateSpy).not.toHaveBeenCalled()
				})

				test("leave unmodified should leave aggregate data unmodified", async () => {
					// Arrange
					await handle.write({
						aggregate: {
							type: AbookWriteAggregateType.SET,
							data: sampleAbookAggregateDataOne,
						},
					})

					// Act
					await handle.write({
						aggregate: {
							type: AbookWriteAggregateType.LEAVE_UNMODIFIED,
						},
					})

					// Assert
					const updatedAbook = await handle.mustRead()
					expect(updatedAbook.aggregate.totalEntries).toBe(
						sampleAbookAggregateDataOne.totalEntries,
					)
					expect(updatedAbook.aggregate.totalDurationMillis).toBe(
						sampleAbookAggregateDataOne.totalDurationMillis,
					)
					expect(aggregateSpy).not.toHaveBeenCalled()
				})

				test("recompute should recompute aggregate data", async () => {
					// Arrange
					await handle.write({
						aggregate: {
							type: AbookWriteAggregateType.SET,
							data: sampleAbookAggregateDataOne,
						},
					})

					// Act
					await handle.write({
						aggregate: {
							type: AbookWriteAggregateType.RECOMPUTE,
						},
					})

					// Assert
					await handle.mustRead()
					expect(aggregateSpy).toHaveBeenCalled()
				})
			})

			describe("exists", () => {
				test("should return true for a created abook", async () => {
					// Arrange
					// (handle is already created in beforeEach)

					// Act
					const exists = await handle.exists()

					// Assert
					expect(exists).toBe(true)
				})

				test("should return false after deleting", async () => {
					// Arrange
					// (handle is already created in beforeEach)

					// Act
					await handle.delete()
					const exists = await handle.exists()

					// Assert
					expect(exists).toBe(false)
				})
			})

			describe("delete", () => {
				test("should remove the abook", async () => {
					// Arrange
					const id = handle.id

					// Act
					await handle.delete()
					const abooks = await store.listAbooks()

					// Assert
					expect(abooks.find((a) => a.id === id)).toBeUndefined()
				})
			})

			describe("read/mustRead", () => {
				test("read should return abook data", async () => {
					// Arrange
					// (handle is already created in beforeEach)

					// Act
					const abook = await handle.read()

					// Assert
					expect(abook).not.toBeNull()
				})

				test("mustRead should return abook data", async () => {
					// Arrange
					// (handle is already created in beforeEach)

					// Act
					const abook = await handle.mustRead()

					// Assert
					expect(abook).not.toBeNull()
				})

				test("read should return null after delete", async () => {
					// Arrange
					await handle.delete()

					// Act
					const abook = await handle.read()

					// Assert
					expect(abook).toBeNull()
				})

				test("mustRead should throw after delete", async () => {
					// Arrange
					await handle.delete()

					// Act & Assert
					await expect(handle.mustRead()).rejects.toThrow(
						AbookNotFoundError,
					)
				})
			})

			describe("writeHeader", () => {
				test("should update the header", async () => {
					// Arrange
					const abook = await handle.mustRead()
					const newHeader: AbookHeaderData = {
						...abook.data.header,
						metadata: {
							title: "New Title",
							description: "New Description",
							privateUserNote: "new note",
						},
					} // Act
					await handle.write({ data: newHeader })
					const updatedAbook = await handle.mustRead()

					// Assert
					expect(updatedAbook.data.header.metadata.title).toBe(
						"New Title",
					)
					expect(updatedAbook.data.header.metadata.description).toBe(
						"New Description",
					)
					expect(aggregateSpy).toHaveBeenCalledOnce()
				})
			})

			describe("error handling", () => {
				test("mustRead should throw AbookNotFoundError with proper message", async () => {
					// Arrange
					const id = handle.id
					await handle.delete()

					// Act & Assert
					await expect(handle.mustRead()).rejects.toThrow(
						AbookNotFoundError,
					)
					await expect(handle.mustRead()).rejects.toThrow(
						`Abook with id ${id} not found`,
					)
				})

				test("mustRead should throw AbookNotFoundError for non-existent abook", async () => {
					// Arrange
					const nonExistentHandle = await store.createAbook(
						createDefaultHeaderData(),
					)
					const nonExistentId = nonExistentHandle.id
					await nonExistentHandle.delete()

					// Act & Assert
					await expect(nonExistentHandle.mustRead()).rejects.toThrow(
						AbookNotFoundError,
					)
					await expect(nonExistentHandle.mustRead()).rejects.toThrow(
						`Abook with id ${nonExistentId} not found`,
					)
				})
			})
		})

		describe("AbookEntryHandle", () => {
			let handle: AbookHandle
			let entryHandle: AbookEntryHandle

			const createEntry = async () => {
				const entryData: AbookEntryData = {
					createdAt: Timestamp.fromDate(new Date()),
					disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
					source: {
						type: AbookEntrySourceType.URL,
						url: "file:///test.mp3",
					},
					ordinalNumber: 1,
				}
				return await handle.createEntry(entryData)
			}

			beforeEach(async () => {
				handle = await store.createAbook(createDefaultHeaderData())
				entryHandle = await createEntry()
				// Clear mock calls from setup - we only want to track calls made during the actual test
				vi.clearAllMocks()
			})

			describe("exists", () => {
				test("should return true for a created entry", async () => {
					// Arrange
					// (entryHandle is already created in beforeEach)

					// Act
					const exists = await entryHandle.exists()

					// Assert
					expect(exists).toBe(true)
				})

				test("should return false after deleting", async () => {
					// Arrange
					// (entryHandle is already created in beforeEach)

					// Act
					await entryHandle.delete()
					const exists = await entryHandle.exists()

					// Assert
					expect(exists).toBe(false)
				})
			})

			describe("delete", () => {
				test("should remove the entry", async () => {
					// Arrange
					// (entryHandle is already created in beforeEach)

					// Act
					await entryHandle.delete()
					const entries = await handle.listEntries()

					// Assert
					expect(
						entries.find((e) => e.id === entryHandle.id),
					).toBeUndefined()
				})
			})

			describe("read/mustRead", () => {
				test("read should return entry data", async () => {
					// Arrange
					// (entryHandle is already created in beforeEach)

					// Act
					const entry = await entryHandle.read()

					// Assert
					expect(entry).not.toBeNull()
					expect(entry).toHaveProperty("data")
					expect(entry).toHaveProperty("aggregate")
				})

				test("mustRead should return entry data", async () => {
					// Arrange
					// (entryHandle is already created in beforeEach)

					// Act
					const entry = await entryHandle.mustRead()

					// Assert
					expect(entry).not.toBeNull()
					expect(entry).toHaveProperty("data")
					expect(entry).toHaveProperty("aggregate")
				})

				test("read should return null after delete", async () => {
					// Arrange
					// (entryHandle is already created in beforeEach)

					// Act
					await entryHandle.delete()
					const entry = await entryHandle.read()

					// Assert
					expect(entry).toBeNull()
				})

				test("mustRead should throw after delete", async () => {
					// Arrange
					const entryId = entryHandle.id

					// Act & Assert
					await entryHandle.delete()
					await expect(entryHandle.mustRead()).rejects.toThrow(
						AbookNotFoundError,
					)
					await expect(entryHandle.mustRead()).rejects.toThrow(
						`Entry with id ${entryId} not found`,
					)
				})

				test("mustRead should throw AbookNotFoundError for non-existent entry", async () => {
					// Arrange
					const newEntry = await createEntry()
					const entryId = newEntry.id
					await newEntry.delete()

					// Act & Assert
					await expect(newEntry.mustRead()).rejects.toThrow(
						AbookNotFoundError,
					)
					await expect(newEntry.mustRead()).rejects.toThrow(
						`Entry with id ${entryId} not found`,
					)
				})
			})

			describe("write abook aggregate", () => {
				const sampleAbookAggregateDataOne: AbookAggregateData = {
					totalEntries: 4321,
					totalDurationMillis: 7654321,
				}

				test("set should set aggregate data for abook", async () => {
					// Act
					await handle.write({
						aggregate: {
							type: AbookWriteAggregateType.SET,
							data: sampleAbookAggregateDataOne,
						},
					})

					// Assert
					const updatedAbook = await handle.mustRead()
					expect(updatedAbook.aggregate.totalEntries).toBe(
						sampleAbookAggregateDataOne.totalEntries,
					)
					expect(updatedAbook.aggregate.totalDurationMillis).toBe(
						sampleAbookAggregateDataOne.totalDurationMillis,
					)
				})

				test("clear should clear aggregate data for abook", async () => {
					// Arrange
					await handle.write({
						aggregate: {
							type: AbookWriteAggregateType.SET,
							data: sampleAbookAggregateDataOne,
						},
					})

					// Act
					await handle.write({
						aggregate: {
							type: AbookWriteAggregateType.CLEAR,
						},
					})

					// Assert
					const updatedAbook = await handle.mustRead()
					expect(updatedAbook.aggregate.totalEntries).toEqual(-1)
					expect(updatedAbook.aggregate.totalDurationMillis).toEqual(
						-1,
					)
					expect(aggregateSpy).not.toHaveBeenCalled()
				})

				test("leave unmodified should leave aggregate data unmodified", async () => {
					// Arrange
					await handle.write({
						aggregate: {
							type: AbookWriteAggregateType.SET,
							data: sampleAbookAggregateDataOne,
						},
					})

					// Act
					await handle.write({
						aggregate: {
							type: AbookWriteAggregateType.LEAVE_UNMODIFIED,
						},
					})

					// Assert
					const updatedAbook = await handle.mustRead()
					expect(updatedAbook.aggregate.totalEntries).toBe(
						sampleAbookAggregateDataOne.totalEntries,
					)
					expect(updatedAbook.aggregate.totalDurationMillis).toBe(
						sampleAbookAggregateDataOne.totalDurationMillis,
					)
					expect(aggregateSpy).not.toHaveBeenCalled()
				})

				test("recompute should recompute aggregate data", async () => {
					// Arrange
					await handle.write({
						aggregate: {
							type: AbookWriteAggregateType.SET,
							data: sampleAbookAggregateDataOne,
						},
					})

					// Act
					await handle.write({
						aggregate: {
							type: AbookWriteAggregateType.RECOMPUTE,
						},
					})

					// Assert
					await handle.mustRead()
					expect(aggregateSpy).toHaveBeenCalled()
				})
			})

			describe("write entry aggregate", () => {
				const sampleEntryAggregateDataOne: AbookEntryAggregateData = {
					blobSize: 1234567,
					metadata: {
						extractSource: {
							type: AbookEntrySourceType.UPLOAD,
						},
						extractTimestamp: Timestamp.fromNumber(123),
						metadata: {
							audio: {
								type: BlobMetadataResultType.SUCCESS,
								metadata: {
									duration: 2355,
								},
							},
							image: {
								type: BlobMetadataResultType.ERROR,
								error: SimpleSerializedError.fromAny(
									"Error message",
								),
							},
						},
					},
				}

				test("set should set aggregate data for entry", async () => {
					// Act
					await entryHandle.write({
						aggregate: {
							type: AbookWriteAggregateType.SET,
							data: sampleEntryAggregateDataOne,
						},
					})

					// Assert
					const updatedEntry = await entryHandle.mustRead()

					expect(updatedEntry.aggregate.blobSize).toBe(
						sampleEntryAggregateDataOne.blobSize,
					)
				})

				test("clear should clear aggregate data for entry", async () => {
					// Arrange
					await entryHandle.write({
						aggregate: {
							type: AbookWriteAggregateType.SET,
							data: sampleEntryAggregateDataOne,
						},
					})

					// Act
					await entryHandle.write({
						aggregate: {
							type: AbookWriteAggregateType.CLEAR,
						},
					})

					// Assert
					const updatedEntry = await entryHandle.mustRead()
					expect(updatedEntry.aggregate.blobSize).toBeNull()
					expect(
						testStore.abookEntryAggregator.aggregate,
					).not.toHaveBeenCalled()
				})

				test("leave unmodified should leave aggregate data unmodified", async () => {
					// Arrange
					await entryHandle.write({
						aggregate: {
							type: AbookWriteAggregateType.SET,
							data: sampleEntryAggregateDataOne,
						},
					})

					// Act
					await entryHandle.write({
						aggregate: {
							type: AbookWriteAggregateType.LEAVE_UNMODIFIED,
						},
					})

					// Assert
					const updatedEntry = await entryHandle.mustRead()
					expect(updatedEntry.aggregate.blobSize).toBe(
						sampleEntryAggregateDataOne.blobSize,
					)
					expect(
						testStore.abookEntryAggregator.aggregate,
					).not.toHaveBeenCalled()
				})

				test("should not change aggregate data after blob write", async () => {
					// Arrange
					await entryHandle.write({
						aggregate: {
							type: AbookWriteAggregateType.SET,
							data: sampleEntryAggregateDataOne,
						},
					})
					const entryBeforeBlob = await entryHandle.mustRead()

					// Act
					const writer = await entryHandle.getBlobWriter()
					const testData = new Blob(["different blob data"])
					await writer.write(testData)
					await writer.close()
					const entryAfterBlob = await entryHandle.mustRead()

					// Assert
					expect(entryAfterBlob.aggregate.blobSize).toBe(
						entryBeforeBlob.aggregate.blobSize,
					)
					// Use JSON comparison to avoid reference equality issues in serialized data
					expect(
						new DeepEqualComparator().equals(
							entryAfterBlob.aggregate.metadata,
							entryBeforeBlob.aggregate.metadata,
						),
					).toBe(true)
					expect(
						testStore.abookEntryAggregator.aggregate,
					).not.toHaveBeenCalled()
				})

				test("recompute should recompute aggregate data", async () => {
					// Arrange
					await entryHandle.write({
						aggregate: {
							type: AbookWriteAggregateType.SET,
							data: sampleEntryAggregateDataOne,
						},
					})
					const writer = await entryHandle.getBlobWriter()
					const data = new TextEncoder().encode("test data")
					await writer.write(data.buffer)
					await writer.close() // Act
					await entryHandle.write({
						aggregate: {
							type: AbookWriteAggregateType.RECOMPUTE,
						},
					})

					// Assert
					const updatedEntry = await entryHandle.mustRead()
					expect(updatedEntry.aggregate.blobSize).toBe(data.length)
					expect(
						testStore.abookEntryAggregator.aggregate,
					).toHaveBeenCalled()
				})
			})

			describe("write", () => {
				test("should update the entry data", async () => {
					// Arrange
					const entry = await entryHandle.mustRead()
					const newData: AbookEntryData = {
						...entry.data,
						disposition: AbookEntryDisposition.COVER_IMAGE,
					}

					// Act
					await entryHandle.write({ data: newData })
					const updatedEntry = await entryHandle.mustRead()

					// Assert
					expect(updatedEntry.data.disposition).toBe(
						AbookEntryDisposition.COVER_IMAGE,
					)
				})
			})

			describe("blob", () => {
				test("readBlob should throw when entry does not exist", async () => {
					// Arrange
					await entryHandle.delete()

					// Act & Assert
					await expect(entryHandle.readBlob()).rejects.toThrow(
						AbookEntryNotFoundError,
					)
				})

				test("mustReadBlob should throw when entry does not exist", async () => {
					// Arrange
					await entryHandle.delete()

					// Act & Assert
					await expect(entryHandle.mustReadBlob()).rejects.toThrow(
						AbookEntryNotFoundError,
					)
				})

				test("readBlob should return null when blob does not exist", async () => {
					// Act
					const blob = await entryHandle.readBlob()

					// Assert
					expect(blob).toBeNull()
				})

				test("should write and read blob data", async () => {
					// Arrange
					const testData = new Blob(["hello world"])

					// Act
					const writer = await entryHandle.getBlobWriter()
					await writer.write(testData)
					await writer.close()
					const blob = await entryHandle.readBlob()
					expect(blob).not.toBeNull()
					const blobText = await blob!.text()

					// Assert
					expect(blob).not.toBeNull()
					expect(blobText).toBe("hello world")
				})

				test("mustReadBlob should throw when blob does not exist", async () => {
					// Arrange
					const newEntry = await createEntry()

					// Act & Assert
					await expect(newEntry.mustReadBlob()).rejects.toThrow(
						AbookEntryBlobNotFoundError,
					)
				})

				test("mustReadBlob should return blob when it exists", async () => {
					// Arrange
					const testData = new Blob(["hello world"])
					const writer = await entryHandle.getBlobWriter()
					await writer.write(testData)
					await writer.close()

					// Act
					const blob = await entryHandle.mustReadBlob()

					// Assert
					expect(blob).toBeDefined()
					expect(await blob.text()).toBe("hello world")
				})
			})
		})
	})
})
