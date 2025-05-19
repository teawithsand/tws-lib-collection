import { describe, expect, test } from "vitest"
import { DbSchemaConstants } from "../../db/schema"
import { SdelkaCardQueue } from "./sdelkaQueue"

describe("SdelkaCardQueue", () => {
	test("NEW equals to default schema queue", () => {
		expect(SdelkaCardQueue.NEW).toStrictEqual(
			DbSchemaConstants.DEFAULT_QUEUE,
		)
	})
})
