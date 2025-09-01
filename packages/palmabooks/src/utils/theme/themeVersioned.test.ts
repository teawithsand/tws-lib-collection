import { SerializerTester, TestData } from "@teawithsand/reserd"
import { describe, test } from "vitest"
import { themeVersionedType, type Theme } from "./themeVersioned"

describe("themeVersionedType", () => {
	test("should serialize and deserialize all theme values correctly", () => {
		const testData = TestData.createFromPairs<unknown, Theme>([
			[{ version: 1, data: "light" }, "light"],
			[{ version: 1, data: "dark" }, "dark"],
			[{ version: 1, data: "auto" }, "auto"],
		])

		const tester = new SerializerTester({
			testData,
			serializer: themeVersionedType,
		})
		tester.runAllTests()
	})
})
