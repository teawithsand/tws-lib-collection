import { describe, expect, test } from "vitest"
import { Errors, StackFrame } from "./error"

/**
 * Test data for various stack trace formats
 */
interface StackTraceTestCase {
	name: string
	stack: string
	expected: StackFrame[]
}

/**
 * Node.js/V8 (Chrome) stack trace test cases
 */
const v8StackTraces: StackTraceTestCase[] = [
	{
		name: "standard V8 format with parentheses",
		stack: `Error: Test error
    at TestClass.method (/path/to/file.js:10:5)
    at async main (/path/to/main.js:20:15)
    at Object.<anonymous> (/path/to/index.js:5:1)`,
		expected: [
			{
				functionName: "TestClass.method",
				fileName: "/path/to/file.js",
				lineNumber: 10,
				columnNumber: 5,
				raw: "at TestClass.method (/path/to/file.js:10:5)",
			},
			{
				functionName: "async main",
				fileName: "/path/to/main.js",
				lineNumber: 20,
				columnNumber: 15,
				raw: "at async main (/path/to/main.js:20:15)",
			},
			{
				functionName: "Object.<anonymous>",
				fileName: "/path/to/index.js",
				lineNumber: 5,
				columnNumber: 1,
				raw: "at Object.<anonymous> (/path/to/index.js:5:1)",
			},
		],
	},
	{
		name: "V8 format with anonymous functions",
		stack: `Error: Test error
    at <anonymous> (/path/to/file.js:10:5)
    at /path/to/file.js:20:15`,
		expected: [
			{
				functionName: null,
				fileName: "/path/to/file.js",
				lineNumber: 10,
				columnNumber: 5,
				raw: "at <anonymous> (/path/to/file.js:10:5)",
			},
			{
				functionName: null,
				fileName: "/path/to/file.js",
				lineNumber: 20,
				columnNumber: 15,
				raw: "at /path/to/file.js:20:15",
			},
		],
	},
	{
		name: "V8 format without column numbers",
		stack: `Error: Test error
    at TestFunction (/path/to/file.js:10)
    at main (/path/to/main.js:20)`,
		expected: [
			{
				functionName: "TestFunction",
				fileName: "/path/to/file.js",
				lineNumber: 10,
				columnNumber: null,
				raw: "at TestFunction (/path/to/file.js:10)",
			},
			{
				functionName: "main",
				fileName: "/path/to/main.js",
				lineNumber: 20,
				columnNumber: null,
				raw: "at main (/path/to/main.js:20)",
			},
		],
	},
	{
		name: "Chrome DevConsole format with anonymous context",
		stack: `Error: Sample error for stack trace demonstration
    at funcC (<anonymous>:13:9)
    at funcB (<anonymous>:8:3)
    at funcA (<anonymous>:4:3)
    at <anonymous>:17:3`,
		expected: [
			{
				functionName: "funcC",
				fileName: "<anonymous>",
				lineNumber: 13,
				columnNumber: 9,
				raw: "at funcC (<anonymous>:13:9)",
			},
			{
				functionName: "funcB",
				fileName: "<anonymous>",
				lineNumber: 8,
				columnNumber: 3,
				raw: "at funcB (<anonymous>:8:3)",
			},
			{
				functionName: "funcA",
				fileName: "<anonymous>",
				lineNumber: 4,
				columnNumber: 3,
				raw: "at funcA (<anonymous>:4:3)",
			},
			{
				functionName: null,
				fileName: "<anonymous>",
				lineNumber: 17,
				columnNumber: 3,
				raw: "at <anonymous>:17:3",
			},
		],
	},
	{
		name: "Chrome with URLs",
		stack: `Error: Test error
    at testFunction (https://example.com/js/app.js:10:5)
    at HTMLButtonElement.<anonymous> (https://example.com/js/main.js:20:15)
    at https://example.com/js/vendor.js:100:25`,
		expected: [
			{
				functionName: "testFunction",
				fileName: "https://example.com/js/app.js",
				lineNumber: 10,
				columnNumber: 5,
				raw: "at testFunction (https://example.com/js/app.js:10:5)",
			},
			{
				functionName: "HTMLButtonElement.<anonymous>",
				fileName: "https://example.com/js/main.js",
				lineNumber: 20,
				columnNumber: 15,
				raw: "at HTMLButtonElement.<anonymous> (https://example.com/js/main.js:20:15)",
			},
			{
				functionName: null,
				fileName: "https://example.com/js/vendor.js",
				lineNumber: 100,
				columnNumber: 25,
				raw: "at https://example.com/js/vendor.js:100:25",
			},
		],
	},
	{
		name: "webpack/bundler transformed stacks",
		stack: `Error: Test error
    at Object.testFunction (webpack:///./src/components/App.js:10:5)
    at Object.exports.render (webpack:///./src/index.js:20:15)
    at webpack:///./src/main.js:5:1`,
		expected: [
			{
				functionName: "Object.testFunction",
				fileName: "webpack:///./src/components/App.js",
				lineNumber: 10,
				columnNumber: 5,
				raw: "at Object.testFunction (webpack:///./src/components/App.js:10:5)",
			},
			{
				functionName: "Object.exports.render",
				fileName: "webpack:///./src/index.js",
				lineNumber: 20,
				columnNumber: 15,
				raw: "at Object.exports.render (webpack:///./src/index.js:20:15)",
			},
			{
				functionName: null,
				fileName: "webpack:///./src/main.js",
				lineNumber: 5,
				columnNumber: 1,
				raw: "at webpack:///./src/main.js:5:1",
			},
		],
	},
]

/**
 * Firefox stack trace test cases
 */
const firefoxStackTraces: StackTraceTestCase[] = [
	{
		name: "standard Firefox format",
		stack: `Error: Test error
testFunction@/path/to/file.js:10:5
main@/path/to/main.js:20:15
@/path/to/anonymous.js:5:1`,
		expected: [
			{
				functionName: "testFunction",
				fileName: "/path/to/file.js",
				lineNumber: 10,
				columnNumber: 5,
				raw: "testFunction@/path/to/file.js:10:5",
			},
			{
				functionName: "main",
				fileName: "/path/to/main.js",
				lineNumber: 20,
				columnNumber: 15,
				raw: "main@/path/to/main.js:20:15",
			},
			{
				functionName: null,
				fileName: "/path/to/anonymous.js",
				lineNumber: 5,
				columnNumber: 1,
				raw: "@/path/to/anonymous.js:5:1",
			},
		],
	},
	{
		name: "Firefox format without column numbers",
		stack: `Error: Test error
testFunction@/path/to/file.js:10
main@/path/to/main.js:20`,
		expected: [
			{
				functionName: "testFunction",
				fileName: "/path/to/file.js",
				lineNumber: 10,
				columnNumber: null,
				raw: "testFunction@/path/to/file.js:10",
			},
			{
				functionName: "main",
				fileName: "/path/to/main.js",
				lineNumber: 20,
				columnNumber: null,
				raw: "main@/path/to/main.js:20",
			},
		],
	},
	{
		name: "Firefox DevConsole format with debugger eval",
		stack: `Error: Sample error for stack trace demonstration
funcC@debugger eval code:13:9
funcB@debugger eval code:8:3
funcA@debugger eval code:4:3
@debugger eval code:17:3`,
		expected: [
			{
				functionName: "funcC",
				fileName: "debugger eval code",
				lineNumber: 13,
				columnNumber: 9,
				raw: "funcC@debugger eval code:13:9",
			},
			{
				functionName: "funcB",
				fileName: "debugger eval code",
				lineNumber: 8,
				columnNumber: 3,
				raw: "funcB@debugger eval code:8:3",
			},
			{
				functionName: "funcA",
				fileName: "debugger eval code",
				lineNumber: 4,
				columnNumber: 3,
				raw: "funcA@debugger eval code:4:3",
			},
			{
				functionName: null,
				fileName: "debugger eval code",
				lineNumber: 17,
				columnNumber: 3,
				raw: "@debugger eval code:17:3",
			},
		],
	},
]

/**
 * Safari stack trace test cases
 */
const safariStackTraces: StackTraceTestCase[] = [
	{
		name: "standard Safari format",
		stack: `Error: Test error
testFunction@/path/to/file.js:10:5
main@/path/to/main.js:20:15
global code@/path/to/script.js:1:1`,
		expected: [
			{
				functionName: "testFunction",
				fileName: "/path/to/file.js",
				lineNumber: 10,
				columnNumber: 5,
				raw: "testFunction@/path/to/file.js:10:5",
			},
			{
				functionName: "main",
				fileName: "/path/to/main.js",
				lineNumber: 20,
				columnNumber: 15,
				raw: "main@/path/to/main.js:20:15",
			},
			{
				functionName: "global code",
				fileName: "/path/to/script.js",
				lineNumber: 1,
				columnNumber: 1,
				raw: "global code@/path/to/script.js:1:1",
			},
		],
	},
	{
		name: "Safari format with just filename",
		stack: `Error: Test error
testFunction@/path/to/file.js
main@some-url.com/script.js`,
		expected: [
			{
				functionName: "testFunction",
				fileName: "/path/to/file.js",
				lineNumber: null,
				columnNumber: null,
				raw: "testFunction@/path/to/file.js",
			},
			{
				functionName: "main",
				fileName: "some-url.com/script.js",
				lineNumber: null,
				columnNumber: null,
				raw: "main@some-url.com/script.js",
			},
		],
	},
]

/**
 * Simple format test cases
 */
const simpleFormatStackTraces: StackTraceTestCase[] = [
	{
		name: "simple file:line:column format",
		stack: `Error: Test error
/path/to/file.js:10:5
/path/to/main.js:20:15`,
		expected: [
			{
				functionName: null,
				fileName: "/path/to/file.js",
				lineNumber: 10,
				columnNumber: 5,
				raw: "/path/to/file.js:10:5",
			},
			{
				functionName: null,
				fileName: "/path/to/main.js",
				lineNumber: 20,
				columnNumber: 15,
				raw: "/path/to/main.js:20:15",
			},
		],
	},
	{
		name: "simple file:line format",
		stack: `Error: Test error
/path/to/file.js:10
/path/to/main.js:20`,
		expected: [
			{
				functionName: null,
				fileName: "/path/to/file.js",
				lineNumber: 10,
				columnNumber: null,
				raw: "/path/to/file.js:10",
			},
			{
				functionName: null,
				fileName: "/path/to/main.js",
				lineNumber: 20,
				columnNumber: null,
				raw: "/path/to/main.js:20",
			},
		],
	},
]

/**
 * Mixed and edge case test cases
 */
const mixedAndEdgeCaseStackTraces: StackTraceTestCase[] = [
	{
		name: "mixed formats in same stack",
		stack: `Error: Test error
    at testFunction (/path/to/file.js:10:5)
main@/path/to/main.js:20:15
/path/to/simple.js:30:25`,
		expected: [
			{
				functionName: "testFunction",
				fileName: "/path/to/file.js",
				lineNumber: 10,
				columnNumber: 5,
				raw: "at testFunction (/path/to/file.js:10:5)",
			},
			{
				functionName: "main",
				fileName: "/path/to/main.js",
				lineNumber: 20,
				columnNumber: 15,
				raw: "main@/path/to/main.js:20:15",
			},
			{
				functionName: null,
				fileName: "/path/to/simple.js",
				lineNumber: 30,
				columnNumber: 25,
				raw: "/path/to/simple.js:30:25",
			},
		],
	},
	{
		name: "source map generated stacks",
		stack: `Error: Test error
    at MyComponent.render (App.tsx:15:12)
    at updateComponent (react-dom.development.js:10123:18)
    at performUnitOfWork (react-dom.development.js:13999:12)`,
		expected: [
			{
				functionName: "MyComponent.render",
				fileName: "App.tsx",
				lineNumber: 15,
				columnNumber: 12,
				raw: "at MyComponent.render (App.tsx:15:12)",
			},
			{
				functionName: "updateComponent",
				fileName: "react-dom.development.js",
				lineNumber: 10123,
				columnNumber: 18,
				raw: "at updateComponent (react-dom.development.js:10123:18)",
			},
			{
				functionName: "performUnitOfWork",
				fileName: "react-dom.development.js",
				lineNumber: 13999,
				columnNumber: 12,
				raw: "at performUnitOfWork (react-dom.development.js:13999:12)",
			},
		],
	},
	{
		name: "empty lines and whitespace",
		stack: `Error: Test error

    at testFunction (/path/to/file.js:10:5)
    
    at main (/path/to/main.js:20:15)
    `,
		expected: [
			{
				functionName: "testFunction",
				fileName: "/path/to/file.js",
				lineNumber: 10,
				columnNumber: 5,
				raw: "at testFunction (/path/to/file.js:10:5)",
			},
			{
				functionName: "main",
				fileName: "/path/to/main.js",
				lineNumber: 20,
				columnNumber: 15,
				raw: "at main (/path/to/main.js:20:15)",
			},
		],
	},
	{
		name: "unrecognized formats gracefully handled",
		stack: `Error: Test error
some random text that doesn't match any pattern
another line without proper format`,
		expected: [
			{
				functionName: null,
				fileName: null,
				lineNumber: null,
				columnNumber: null,
				raw: "some random text that doesn't match any pattern",
			},
			{
				functionName: null,
				fileName: null,
				lineNumber: null,
				columnNumber: null,
				raw: "another line without proper format",
			},
		],
	},
]

describe("Errors.parseStackTrace - V8/Chrome formats", () => {
	test.each(v8StackTraces)("should parse $name", ({ stack, expected }) => {
		const frames = Errors.parseStackTrace(stack)
		expect(frames).toEqual(expected)
	})
})

describe("Errors.parseStackTrace - Firefox formats", () => {
	test.each(firefoxStackTraces)(
		"should parse $name",
		({ stack, expected }) => {
			const frames = Errors.parseStackTrace(stack)
			expect(frames).toEqual(expected)
		},
	)
})

describe("Errors.parseStackTrace - Safari formats", () => {
	test.each(safariStackTraces)(
		"should parse $name",
		({ stack, expected }) => {
			const frames = Errors.parseStackTrace(stack)
			expect(frames).toEqual(expected)
		},
	)
})

describe("Errors.parseStackTrace - Simple formats", () => {
	test.each(simpleFormatStackTraces)(
		"should parse $name",
		({ stack, expected }) => {
			const frames = Errors.parseStackTrace(stack)
			expect(frames).toEqual(expected)
		},
	)
})

describe("Errors.parseStackTrace - Mixed and edge cases", () => {
	test.each(mixedAndEdgeCaseStackTraces)(
		"should handle $name",
		({ stack, expected }) => {
			const frames = Errors.parseStackTrace(stack)
			expect(frames).toEqual(expected)
		},
	)
})

describe("Errors.parseStackTrace - Edge cases", () => {
	test("should return empty array for null/undefined/empty stack", () => {
		expect(Errors.parseStackTrace("")).toEqual([])
		expect(Errors.parseStackTrace(null as any)).toEqual([])
		expect(Errors.parseStackTrace(undefined as any)).toEqual([])
	})

	test("should skip error message lines", () => {
		const stack = `TypeError: Cannot read property 'x' of undefined
ReferenceError: y is not defined
SyntaxError: Unexpected token
    at testFunction (/path/to/file.js:10:5)
    at main (/path/to/main.js:20:15)`

		const frames = Errors.parseStackTrace(stack)

		expect(frames).toHaveLength(2)
		expect(frames[0]).toEqual({
			functionName: "testFunction",
			fileName: "/path/to/file.js",
			lineNumber: 10,
			columnNumber: 5,
			raw: "at testFunction (/path/to/file.js:10:5)",
		})
		expect(frames[1]).toEqual({
			functionName: "main",
			fileName: "/path/to/main.js",
			lineNumber: 20,
			columnNumber: 15,
			raw: "at main (/path/to/main.js:20:15)",
		})
	})
})

describe("Errors.parseStackTrace - Live stack trace test", () => {
	test("should parse real Node.js error stack trace generated in test", () => {
		// Helper function to create nested calls for a realistic stack trace
		const createNestedError = () => {
			const level3 = () => {
				throw new Error("Test error from nested function")
			}

			const level2 = () => {
				level3()
			}

			const level1 = () => {
				level2()
			}

			try {
				level1()
			} catch (error) {
				return error as Error
			}
			throw new Error("Should not reach this point")
		}

		const error = createNestedError()

		// Verify we have a real stack trace
		expect(error.stack).toBeDefined()
		expect(typeof error.stack).toBe("string")

		if (error.stack) {
			const frames = Errors.parseStackTrace(error.stack)

			// Should have at least a few frames
			expect(frames.length).toBeGreaterThan(2)

			// First frame should reference this test file
			expect(
				frames.some(
					(frame) =>
						frame.fileName?.includes("stackTrace.test.ts") ||
						frame.fileName?.includes("stackTrace.test.js"),
				),
			).toBe(true)

			// All frames should have valid structure
			frames.forEach((frame) => {
				expect(frame).toHaveProperty("functionName")
				expect(frame).toHaveProperty("fileName")
				expect(frame).toHaveProperty("lineNumber")
				expect(frame).toHaveProperty("columnNumber")
				expect(frame).toHaveProperty("raw")
				expect(typeof frame.raw).toBe("string")
				expect(frame.raw.length).toBeGreaterThan(0)
			})

			// Should have line numbers for most frames
			const framesWithLineNumbers = frames.filter(
				(frame) => frame.lineNumber !== null,
			)
			expect(framesWithLineNumbers.length).toBeGreaterThan(0)
		}
	})

	test("should parse stack trace with function names from test context", () => {
		// Function with a specific name to check for in stack trace
		const testFunctionWithSpecificName = () => {
			const innerFunction = () => {
				return new Error("Error with specific function names in stack")
			}
			return innerFunction()
		}

		const error = testFunctionWithSpecificName()

		if (error.stack) {
			const frames = Errors.parseStackTrace(error.stack)

			// Should find our test function names in the stack
			const functionNames = frames
				.map((frame) => frame.functionName)
				.filter((name) => name !== null)

			expect(functionNames.length).toBeGreaterThan(0)

			// At least one frame should reference our test functions
			expect(
				functionNames.some(
					(name) =>
						name?.includes("testFunctionWithSpecificName") ||
						name?.includes("innerFunction"),
				),
			).toBe(true)
		}
	})
})
