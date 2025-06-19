import { describe, test } from "vitest"
import { App } from "./app"
import { AppDi } from "./di"

describe("AppDi", () => {
	test("can build and pass checks", async () => {
		const builder = AppDi.makeDiBuilder(AppDi.DI_TEST_CONFIG)

		const di = await builder
			.assertAllDefinedWithDefinitionObject({
				logger: undefined,
				sqliteClient: undefined,
				mintay: undefined,
				atomStore: undefined,
				collectionService: undefined,
				releaseHelper: undefined,
				translationService: undefined,
				appBarService: undefined,
				backendClient: undefined,
				backendService: undefined,
				cardService: undefined,
			})
			.build()

		// Check that we can make App
		const app = new App(di)

		await app.release()
	})
})
