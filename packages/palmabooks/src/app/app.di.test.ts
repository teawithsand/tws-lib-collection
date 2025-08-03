import { describe, test } from "vitest"
import { App } from "./app"
import { AppDi } from "./app.di"

describe("AppDi", () => {
	test("can build and pass checks", async () => {
		const builder = AppDi.makeDiBuilder(AppDi.DI_TEST_CONFIG)

		const di = await builder
			.assertAllDefinedWithDefinitionObject({
				logger: undefined,
				atomStore: undefined,
				config: undefined,
				releaseHelper: undefined,
				translationService: undefined,
				appBarService: undefined,
				abookStore: undefined,
				abookStoreService: undefined,
				storageManagerService: undefined,
			})
			.build()

		const app = new App(di)

		await app.release()
	})
})
