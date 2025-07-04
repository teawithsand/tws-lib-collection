import {
	AppCardDataExtractor,
	AppCardDataVersionedType,
	AppCollectionDataExtractor,
	AppCollectionDataVersionedType,
	AppMintayTypeSpecParams,
	defaultCardDataFactory,
	defaultCollectionDataFactory,
} from "@/mintay"
import { createStore, JotaiStore } from "@teawithsand/fstate"
import { LibraryBaseLogger, Logger, LoggerImpl } from "@teawithsand/llog"
import { DIBuilder, TypeAssert } from "@teawithsand/lngext"
import {
	DB_MIGRATIONS,
	DrizzleMintay,
	LockingMintay,
	Mintay,
} from "@teawithsand/mintay-core"
import {
	createDrizzleFromClient,
	MigrationManager,
	SqliteClient,
	SqliteInMemoryClient,
	SqliteWorkerClient,
} from "@teawithsand/sqlite-web"
import { AppBarService } from "../domain/appBar/appBarService"
import { CollectionService } from "../domain/collectionsService"
import { DiReleaseHelper } from "./releaseHelper"
import { TransService } from "./trans"

export type AppDiContents = {
	logger: Logger
	sqliteClient: SqliteClient
	mintay: Mintay<AppMintayTypeSpecParams>
	atomStore: JotaiStore

	releaseHelper: DiReleaseHelper

	translationService: TransService
	collectionService: CollectionService
	appBarService: AppBarService
}

const LOG_TAG = "makeAppDi"

export type DiConfig = {
	dbType: "opfs" | "inMemory"
	throwFromRelease?: boolean
}

export class AppDi {
	private constructor() {}

	public static readonly DI_TEST_CONFIG: DiConfig = {
		dbType: "inMemory",
		throwFromRelease: true,
	}

	public static readonly DI_PROD_CONFIG: DiConfig = {
		dbType: "opfs",
	}

	public static readonly makeDiBuilder = (config: DiConfig) =>
		DIBuilder.create<AppDiContents>()
			.setValue(
				"logger",
				new LoggerImpl(
					new LibraryBaseLogger("@teawithsand/mintay-app"),
				),
			)
			.setValue("atomStore", createStore())
			.setValue("translationService", new TransService())
			.setValue("appBarService", new AppBarService())
			.setFactory(
				"releaseHelper",
				async (di) =>
					new DiReleaseHelper({
						logger: di.get("logger"),
						throwFromRelease: config.throwFromRelease === true,
					}),
			)
			.setFactory("sqliteClient", async () => {
				if (config.dbType === "inMemory") {
					return await SqliteInMemoryClient.create()
				} else if (config.dbType === "opfs") {
					return await SqliteWorkerClient.create()
				} else {
					TypeAssert.assertNever(config.dbType)
					return TypeAssert.unreachable()
				}
			})
			.setFactory("mintay", async (di) => {
				const client = di.get("sqliteClient")
				if (config.dbType === "opfs") {
					await client.open({
						filename: "file:mintay-master.sqlite3?vfs=opfs",
					})
				} else {
					await client.open({
						filename: ":memory:",
					})
				}

				const drizzle = createDrizzleFromClient(client)

				const migrator = MigrationManager.createWithClient(client, {
					migrations: DB_MIGRATIONS,
				})

				await migrator.migrateToLatest()
				const version = await migrator.getCurrentVersion()

				di.get("logger").info(
					LOG_TAG,
					"Database migrated successfully to version",
					{ version },
				)

				return LockingMintay.wrapSafe<AppMintayTypeSpecParams>(
					new DrizzleMintay({
						db: drizzle,
						params: {
							collectionDataExtractor:
								new AppCollectionDataExtractor(),
							cardDataExtractor: new AppCardDataExtractor(),
							collectionDataSerializer:
								AppCollectionDataVersionedType,
							cardDataSerializer: AppCardDataVersionedType,
							defaultCardDataFactory,
							defaultCollectionDataFactory,
						},
					}),
				)
			})
			.setFactory("collectionService", async (di) => {
				return new CollectionService({
					collectionStore: di.get("mintay").collectionStore,
				})
			})
}
