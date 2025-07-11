import { describe, expect, test } from "vitest"
import { FaultProviderBuilder } from "./faultProviderBuilder"

type TestFaultPoints = {
	readonly userLogin: readonly [string, number]
	readonly dataProcessing: readonly [object]
	readonly networkCall: readonly []
}

describe("FaultProviderBuilder", () => {
	test("should create builder and register handlers", () => {
		// Arrange
		const builder = FaultProviderBuilder.create<TestFaultPoints>()
		let userLoginCalled = false
		let dataProcessingCalled = false
		let networkCallCalled = false

		// Act
		const faultProvider = builder
			.register("userLogin", (username: string, userId: number) => {
				userLoginCalled = true
				expect(username).toBe("testUser")
				expect(userId).toBe(123)
			})
			.register("dataProcessing", (data: object) => {
				dataProcessingCalled = true
				expect(data).toEqual({ test: "data" })
			})
			.register("networkCall", () => {
				networkCallCalled = true
			})
			.build()

		// Assert - Execute fault points
		faultProvider.faultPoint("userLogin", "testUser", 123)
		faultProvider.faultPoint("dataProcessing", { test: "data" })
		faultProvider.faultPoint("networkCall")

		expect(userLoginCalled).toBe(true)
		expect(dataProcessingCalled).toBe(true)
		expect(networkCallCalled).toBe(true)
	})

	test("should handle unregistered fault points gracefully", () => {
		// Arrange
		const builder = FaultProviderBuilder.create<TestFaultPoints>()
		const faultProvider = builder.build()

		// Act & Assert - Should not throw
		expect(() => {
			faultProvider.faultPoint("userLogin", "test", 456)
			faultProvider.faultPoint("dataProcessing", {})
			faultProvider.faultPoint("networkCall")
		}).not.toThrow()
	})

	test("should support registerAll method", () => {
		// Arrange
		const builder = FaultProviderBuilder.create<TestFaultPoints>()
		let loginHandlerCalled = false
		let networkHandlerCalled = false

		// Act
		const faultProvider = builder
			.registerAll({
				userLogin: (username: string, userId: number) => {
					loginHandlerCalled = true
					expect(username).toBe("bulkUser")
					expect(userId).toBe(789)
				},
				networkCall: () => {
					networkHandlerCalled = true
				},
			})
			.build()

		// Assert
		faultProvider.faultPoint("userLogin", "bulkUser", 789)
		faultProvider.faultPoint("networkCall")

		expect(loginHandlerCalled).toBe(true)
		expect(networkHandlerCalled).toBe(true)
	})
})
