import { describe, expect, test } from "vitest"
import { DbSchemaConstants } from "../../db/schema"
import { MintayCardQueue } from "./sdelkaQueue"

describe("MintayCardQueue", () => {
	test("NEW equals to default schema queue", () => {
		expect(MintayCardQueue.NEW).toStrictEqual(
			DbSchemaConstants.DEFAULT_QUEUE,
		)
	})
})
