import "@testing-library/jest-dom"
import { render } from "@testing-library/react"
import { describe, expect, test } from "vitest"
import { IfBoundary } from "./ifBoundary"

describe("IfBoundary", () => {
	test("renders children when condition is true", () => {
		const { getByText } = render(
			<IfBoundary condition={true}>
				<div>Child content</div>
			</IfBoundary>,
		)

		expect(getByText("Child content")).toBeInTheDocument()
	})

	test("renders fallback when condition is false", () => {
		const { getByText } = render(
			<IfBoundary
				condition={false}
				fallback={<div>Fallback content</div>}
			>
				<div>Child content</div>
			</IfBoundary>,
		)

		expect(getByText("Fallback content")).toBeInTheDocument()
	})

	test("renders nothing when condition is false and no fallback provided", () => {
		const { container } = render(
			<IfBoundary condition={false}>
				<div>Child content</div>
			</IfBoundary>,
		)

		expect(container.firstChild).toBeNull()
	})
})
