import { LibraryBaseLogger, Logger, LoggerImpl } from "@teawithsand/llog"
import { DIBuilder } from "@teawithsand/lngext"
import { DB_MIGRATIONS, DrizzleMintay, Mintay } from "@teawithsand/mintay-core"
import {
	MigrationManager,
	SqliteClient,
	SqliteWorkerClient,
	createDrizzleFromClient,
} from "@teawithsand/sqlite-web"

export type AppDiContents = {
	logger: Logger
	sqliteClient: SqliteClient
	mintay: Mintay
}

const LOG_TAG = "makeAppDi"

export const makeAppDi = () =>
	DIBuilder.create<AppDiContents>()
		.setValue(
			"logger",
			new LoggerImpl(new LibraryBaseLogger("@teawithsand/mintay-app")),
		)
		.setFactory("sqliteClient", async () => {
			return SqliteWorkerClient.create()
		})
		.setFactory("mintay", async (di) => {
			const client = di.get("sqliteClient")
			await client.open({
				filename: "file:mintay-master.sqlite3?vfs=opfs",
			})

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

			return new DrizzleMintay({
				db: drizzle,
			})
		})
		.build()
