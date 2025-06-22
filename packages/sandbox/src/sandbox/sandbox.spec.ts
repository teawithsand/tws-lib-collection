import { createStore, JotaiStore } from "@teawithsand/fstate"
import { afterEach, beforeEach, describe, expect, test } from "vitest"
import { ConsoleLogLevel } from "./childMessage"
import { HtmlBuilder } from "./htmlBuilder"
import { Sandbox } from "./sandbox"
import { SandboxMessage, SandboxMessageType } from "./sandboxMessage"

describe("Sandbox", () => {
	let sandbox: Sandbox
	let store: JotaiStore
	beforeEach(() => {
		store = createStore()
		sandbox = new Sandbox({
			store,
		})
	})

	afterEach(() => {
		sandbox.release()
	})

	test("should run code in sandbox and emit events", async () => {
		const events: SandboxMessage[] = []
		sandbox.bus.addSubscriber((message) => {
			events.push(message)
		})

		sandbox.loadHtml(
			new HtmlBuilder({
				title: "Test Document",
			})
				.addFooterScript({
					content: `console.log("Hello from sandbox!");`,
				})
				.build(),
		)

		for (;;) {
			await new Promise((resolve) => setTimeout(resolve, 10))
			if (store.get(sandbox.state).loaded) {
				break
			}
		}

		expect(events.length).toBeGreaterThan(0)
	})

	test("should properly track sandbox state during loading", async () => {
		const initialState = store.get(sandbox.state)
		expect(initialState.loaded).toBe(false)
		expect(initialState.domContentLoaded).toBe(false)
		expect(initialState.hasErrored).toBe(false)
		expect(initialState.html).toBe("")

		const html = new HtmlBuilder({
			title: "State Test Document",
		})
			.setBodyContent("<h1>Test Content</h1>")
			.build()

		sandbox.loadHtml(html)

		// Check that state is reset with new HTML
		const afterLoadState = store.get(sandbox.state)
		expect(afterLoadState.html).toBe(html)
		expect(afterLoadState.loaded).toBe(false)
		expect(afterLoadState.domContentLoaded).toBe(false)
		expect(afterLoadState.hasErrored).toBe(false)

		// Wait for load event
		await new Promise<void>((resolve) => {
			const checkState = () => {
				const currentState = store.get(sandbox.state)
				if (currentState.loaded) {
					resolve()
				} else {
					setTimeout(checkState, 10)
				}
			}
			checkState()
		})

		const finalState = store.get(sandbox.state)
		expect(finalState.loaded).toBe(true)
		expect(finalState.domContentLoaded).toBe(true)
	})

	test("should emit console messages with correct types and levels", async () => {
		const events: SandboxMessage[] = []
		sandbox.bus.addSubscriber((message) => {
			events.push(message)
		})

		sandbox.loadHtml(
			new HtmlBuilder({
				title: "Console Test",
			})
				.addFooterScript({
					content: `
                    console.log("Info message", 42, true);
                    console.warn("Warning message", { key: "value" });
                    console.error("Error message", new Error("Test error"));
                `,
				})
				.build(),
		)

		// Wait for all console messages
		await new Promise<void>((resolve) => {
			const checkEvents = () => {
				const consoleEvents = events.filter(
					(e) => e.type === SandboxMessageType.CONSOLE,
				)
				if (consoleEvents.length >= 3) {
					resolve()
				} else {
					setTimeout(checkEvents, 10)
				}
			}
			checkEvents()
		})

		const consoleEvents = events.filter(
			(e) => e.type === SandboxMessageType.CONSOLE,
		)

		expect(consoleEvents).toHaveLength(3)

		// Check log message
		const logEvent = consoleEvents.find(
			(e) => e.level === ConsoleLogLevel.LOG,
		)
		expect(logEvent).toBeDefined()
		expect(logEvent!.args).toEqual(["Info message", 42, true])

		// Check warn message
		const warnEvent = consoleEvents.find(
			(e) => e.level === ConsoleLogLevel.WARN,
		)
		expect(warnEvent).toBeDefined()
		expect(warnEvent!.args[0]).toBe("Warning message")
		expect(warnEvent!.args[1]).toEqual({ key: "value" })

		// Check error message
		const errorEvent = consoleEvents.find(
			(e) => e.level === ConsoleLogLevel.ERROR,
		)
		expect(errorEvent).toBeDefined()
		expect(errorEvent!.args[0]).toBe("Error message")
		expect(errorEvent!.args[1]).toEqual({
			name: "Error",
			message: "Test error",
			stack: expect.any(String),
		})
	})

	test("should handle unhandled errors and update state", async () => {
		const events: SandboxMessage[] = []
		sandbox.bus.addSubscriber((message) => {
			events.push(message)
		})

		sandbox.loadHtml(
			new HtmlBuilder({
				title: "Error Test",
			})
				.addFooterScript({
					content: `
                    setTimeout(() => {
                        throw new Error("Unhandled error");
                    }, 50);
                `,
				})
				.build(),
		)

		// Wait for error to occur
		await new Promise<void>((resolve) => {
			const checkError = () => {
				const state = store.get(sandbox.state)
				const errorEvents = events.filter(
					(e) => e.type === SandboxMessageType.ERROR,
				)
				if (state.hasErrored && errorEvents.length > 0) {
					resolve()
				} else {
					setTimeout(checkError, 10)
				}
			}
			setTimeout(checkError, 100) // Give time for the setTimeout in the script
		})

		const state = store.get(sandbox.state)
		expect(state.hasErrored).toBe(true)

		const errorEvents = events.filter(
			(e) => e.type === SandboxMessageType.ERROR,
		)
		expect(errorEvents.length).toBeGreaterThan(0)

		const errorEvent = errorEvents[0]!
		expect(errorEvent.message).toContain("Unhandled error")
		expect(errorEvent.stack).toBeDefined()
	})

	test("should handle unhandled promise rejections", async () => {
		const events: SandboxMessage[] = []
		sandbox.bus.addSubscriber((message) => {
			events.push(message)
		})

		sandbox.loadHtml(
			new HtmlBuilder({
				title: "Promise Rejection Test",
			})
				.addFooterScript({
					content: `
                    setTimeout(() => {
                        Promise.reject(new Error("Unhandled promise rejection"));
                    }, 50);
                `,
				})
				.build(),
		)

		// Wait for promise rejection
		await new Promise<void>((resolve) => {
			const checkRejection = () => {
				const state = store.get(sandbox.state)
				const rejectionEvents = events.filter(
					(e) => e.type === SandboxMessageType.UNHANDLED_REJECTION,
				)
				if (state.hasErrored && rejectionEvents.length > 0) {
					resolve()
				} else {
					setTimeout(checkRejection, 10)
				}
			}
			setTimeout(checkRejection, 100)
		})

		const state = store.get(sandbox.state)
		expect(state.hasErrored).toBe(true)

		const rejectionEvents = events.filter(
			(e) => e.type === SandboxMessageType.UNHANDLED_REJECTION,
		)
		expect(rejectionEvents.length).toBeGreaterThan(0)

		const rejectionEvent = rejectionEvents[0]!
		expect(rejectionEvent.reason).toEqual({
			name: "Error",
			message: "Unhandled promise rejection",
			stack: expect.any(String),
		})
	})

	test("should support PyScript execution", async () => {
		const events: SandboxMessage[] = []
		sandbox.bus.addSubscriber((message) => {
			events.push(message)
		})

		sandbox.loadHtml(
			new HtmlBuilder({
				title: "PyScript Test",
			})
				.includePyScript("2024.1.1")
				.setBodyContent(
					`
                <py-script>
                    print("Hello from Python!")
                    import sys
                    print(f"Python version: {sys.version}")
                </py-script>
            `,
				)
				.build(),
		)

		// Wait for PyScript to load and execute
		await new Promise<void>((resolve) => {
			const checkPyScript = () => {
				const consoleEvents = events.filter(
					(e) =>
						e.type === SandboxMessageType.CONSOLE &&
						e.args.some(
							(arg) =>
								typeof arg === "string" &&
								arg.includes("Hello from Python"),
						),
				)
				if (consoleEvents.length > 0) {
					resolve()
				} else {
					setTimeout(checkPyScript, 100)
				}
			}
			setTimeout(checkPyScript, 1000) // Give PyScript time to load
		})

		const pythonConsoleEvents = events.filter(
			(e) =>
				e.type === SandboxMessageType.CONSOLE &&
				e.args.some(
					(arg) =>
						typeof arg === "string" &&
						arg.includes("Hello from Python"),
				),
		)

		expect(pythonConsoleEvents.length).toBeGreaterThan(0)
	})

	test("should support TypeScript compilation and execution", async () => {
		const events: SandboxMessage[] = []
		sandbox.bus.addSubscriber((message) => {
			events.push(message)
		})

		sandbox.loadHtml(
			new HtmlBuilder({
				title: "TypeScript Test",
			})
				.includeTypeScript("5.3.3")
				.addFooterScript({
					content: `
                    // Wait for TypeScript to load
                    setTimeout(() => {
                        if (typeof window.compileTypeScript === 'function') {
                            try {
                                const tsCode = \`
                                    interface Person {
                                        name: string;
                                        age: number;
                                    }
                                    
                                    const person: Person = { name: "John", age: 30 };
                                    console.log("TypeScript person:", person);
                                    console.log("Name length:", person.name.length);
                                \`;
                                
                                const compiled = window.compileTypeScript(tsCode);
                                console.log("TypeScript compiled successfully");
                                eval(compiled);
                            } catch (error) {
                                console.error("TypeScript compilation failed:", error);
                            }
                        } else {
                            console.error("TypeScript compiler not available");
                        }
                    }, 500);
                `,
				})
				.build(),
		)

		// Wait for TypeScript compilation and execution
		await new Promise<void>((resolve) => {
			const checkTypeScript = () => {
				const consoleEvents = events.filter(
					(e) =>
						e.type === SandboxMessageType.CONSOLE &&
						e.args.some(
							(arg) =>
								typeof arg === "string" &&
								arg.includes("TypeScript person"),
						),
				)
				if (consoleEvents.length > 0) {
					resolve()
				} else {
					setTimeout(checkTypeScript, 100)
				}
			}
			setTimeout(checkTypeScript, 1500) // Give TypeScript time to load and compile
		})

		const tsConsoleEvents = events.filter(
			(e) =>
				e.type === SandboxMessageType.CONSOLE &&
				e.args.some(
					(arg) =>
						typeof arg === "string" && arg.includes("TypeScript"),
				),
		)

		expect(tsConsoleEvents.length).toBeGreaterThan(0)

		// Check that compilation was successful
		const successEvents = events.filter(
			(e) =>
				e.type === SandboxMessageType.CONSOLE &&
				e.args.some(
					(arg) =>
						typeof arg === "string" &&
						arg.includes("compiled successfully"),
				),
		)
		expect(successEvents.length).toBeGreaterThan(0)
	})

	test("should reset state when loading new HTML", async () => {
		// Load first HTML and wait for it to complete
		sandbox.loadHtml(
			new HtmlBuilder({
				title: "First Document",
			})
				.addFooterScript({
					content: `console.log("First document loaded");`,
				})
				.build(),
		)

		await new Promise<void>((resolve) => {
			const checkState = () => {
				const state = store.get(sandbox.state)
				if (state.loaded) {
					resolve()
				} else {
					setTimeout(checkState, 10)
				}
			}
			checkState()
		})

		const firstState = store.get(sandbox.state)
		expect(firstState.loaded).toBe(true)
		expect(firstState.domContentLoaded).toBe(true)

		// Load second HTML
		const secondHtml = new HtmlBuilder({
			title: "Second Document",
		})
			.setBodyContent("<p>Second document</p>")
			.build()

		sandbox.loadHtml(secondHtml)

		// Check that state was reset
		const resetState = store.get(sandbox.state)
		expect(resetState.html).toBe(secondHtml)
		expect(resetState.loaded).toBe(false)
		expect(resetState.domContentLoaded).toBe(false)
		expect(resetState.hasErrored).toBe(false)

		// Wait for second document to load
		await new Promise<void>((resolve) => {
			const checkState = () => {
				const state = store.get(sandbox.state)
				if (state.loaded) {
					resolve()
				} else {
					setTimeout(checkState, 10)
				}
			}
			checkState()
		})

		const finalState = store.get(sandbox.state)
		expect(finalState.loaded).toBe(true)
		expect(finalState.html).toBe(secondHtml)
	})

	test("should handle complex object serialization in console messages", async () => {
		const events: SandboxMessage[] = []
		sandbox.bus.addSubscriber((message) => {
			events.push(message)
		})

		sandbox.loadHtml(
			new HtmlBuilder({
				title: "Serialization Test",
			})
				.addFooterScript({
					content: `
                    const complexObject = {
                        string: "test",
                        number: 42,
                        boolean: true,
                        nullValue: null,
                        nested: {
                            array: [1, 2, 3],
                        }
                    };
                    
                    console.log("Complex object:", complexObject);
                    console.log("Simple values:", "string", 123, true, null);
                `,
				})
				.build(),
		)

		await new Promise<void>((resolve) => {
			const checkEvents = () => {
				const consoleEvents = events.filter(
					(e) => e.type === SandboxMessageType.CONSOLE,
				)
				if (consoleEvents.length >= 2) {
					resolve()
				} else {
					setTimeout(checkEvents, 10)
				}
			}
			checkEvents()
		})

		const consoleEvents = events.filter(
			(e) => e.type === SandboxMessageType.CONSOLE,
		)
		expect(consoleEvents.length).toBeGreaterThan(0)

		// Check that complex objects are properly serialized
		const complexObjectEvent = consoleEvents.find((e) =>
			e.args.some(
				(arg) =>
					typeof arg === "string" && arg.includes("Complex object"),
			),
		)
		expect(complexObjectEvent).toBeDefined()

		// The second argument should be the serialized object
		const serializedObject = complexObjectEvent!.args[1] as any
		expect(serializedObject).toBeDefined()
		expect(typeof serializedObject).toBe("object")

		// Check for simple values event
		const simpleValuesEvent = consoleEvents.find((e) =>
			e.args.some(
				(arg) =>
					typeof arg === "string" && arg.includes("Simple values"),
			),
		)
		expect(simpleValuesEvent).toBeDefined()
		expect(simpleValuesEvent!.args).toHaveLength(5) // "Simple values", "string", 123, true, null
		expect(simpleValuesEvent!.args[1]).toBe("string")
		expect(simpleValuesEvent!.args[2]).toBe(123)
		expect(simpleValuesEvent!.args[3]).toBe(true)
		expect(simpleValuesEvent!.args[4]).toBe(null)
	})

	test("should handle event bus subscription and unsubscription", () => {
		const events: SandboxMessage[] = []

		const unsubscribe = sandbox.bus.addSubscriber((message) => {
			events.push(message)
		})

		expect(typeof unsubscribe).toBe("function")

		// Test that we can unsubscribe
		unsubscribe()

		// Load HTML after unsubscribing - should not receive events
		sandbox.loadHtml(
			new HtmlBuilder({
				title: "Unsubscribed Test",
			})
				.addFooterScript({
					content: `console.log("This should not be captured");`,
				})
				.build(),
		)

		// Give some time for potential events
		setTimeout(() => {
			expect(events).toHaveLength(0)
		}, 100)
	})

	test("should handle multiple subscribers", async () => {
		const events1: SandboxMessage[] = []
		const events2: SandboxMessage[] = []

		sandbox.bus.addSubscriber((message) => {
			events1.push(message)
		})

		sandbox.bus.addSubscriber((message) => {
			events2.push(message)
		})

		sandbox.loadHtml(
			new HtmlBuilder({
				title: "Multiple Subscribers Test",
			})
				.addFooterScript({
					content: `console.log("Message for all subscribers");`,
				})
				.build(),
		)

		await new Promise<void>((resolve) => {
			const checkEvents = () => {
				if (events1.length > 0 && events2.length > 0) {
					resolve()
				} else {
					setTimeout(checkEvents, 10)
				}
			}
			checkEvents()
		})

		expect(events1.length).toBeGreaterThan(0)
		expect(events2.length).toBeGreaterThan(0)
		expect(events1.length).toBe(events2.length)
	})

	test("should handle empty HTML content", async () => {
		const events: SandboxMessage[] = []
		sandbox.bus.addSubscriber((message) => {
			events.push(message)
		})

		sandbox.loadHtml(new HtmlBuilder().build())

		await new Promise<void>((resolve) => {
			const checkState = () => {
				const state = store.get(sandbox.state)
				if (state.loaded) {
					resolve()
				} else {
					setTimeout(checkState, 10)
				}
			}
			checkState()
		})

		const state = store.get(sandbox.state)
		expect(state.loaded).toBe(true)
		expect(state.domContentLoaded).toBe(true)
		expect(state.hasErrored).toBe(false)
	})

	test("should handle malformed JavaScript without crashing", async () => {
		const events: SandboxMessage[] = []
		sandbox.bus.addSubscriber((message) => {
			events.push(message)
		})

		sandbox.loadHtml(
			new HtmlBuilder({
				title: "Malformed JS Test",
			})
				.addFooterScript({
					content: `
                    // This should cause a syntax error
                    console.log("Before error");
                    const malformed = {
                        unclosed: "string
                    };
                    console.log("After error - should not execute");
                `,
				})
				.build(),
		)

		await new Promise<void>((resolve) => {
			const checkEvents = () => {
				const errorEvents = events.filter(
					(e) => e.type === SandboxMessageType.ERROR,
				)
				if (errorEvents.length > 0) {
					resolve()
				} else {
					setTimeout(checkEvents, 10)
				}
			}
			setTimeout(checkEvents, 100) // Give time for syntax error
		})

		const state = store.get(sandbox.state)
		expect(state.hasErrored).toBe(true)

		const errorEvents = events.filter(
			(e) => e.type === SandboxMessageType.ERROR,
		)
		expect(errorEvents.length).toBeGreaterThan(0)
	})

	test("should handle CSS and custom header entries", async () => {
		const html = new HtmlBuilder({
			title: "CSS Test",
		})
			.addCssLink(
				"https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css",
			)
			.addCustomHeaderEntry({
				tag: "meta",
				attributes: {
					name: "viewport",
					content: "width=device-width, initial-scale=1",
				},
			})
			.setInlineStyles(
				`
                body { 
                    background-color: #f0f0f0; 
                    font-family: Arial, sans-serif; 
                }
            `,
			)
			.setBodyContent(
				`
                <div class="container">
                    <h1>Styled Content</h1>
                </div>
            `,
			)
			.build()

		expect(html).toContain('rel="stylesheet"')
		expect(html).toContain("bootstrap")
		expect(html).toContain('name="viewport"')
		expect(html).toContain("background-color: #f0f0f0")
		expect(html).toContain("<h1>Styled Content</h1>")

		sandbox.loadHtml(html)

		await new Promise<void>((resolve) => {
			const checkState = () => {
				const state = store.get(sandbox.state)
				if (state.loaded) {
					resolve()
				} else {
					setTimeout(checkState, 10)
				}
			}
			checkState()
		})

		const state = store.get(sandbox.state)
		expect(state.loaded).toBe(true)
		expect(state.html).toBe(html)
	})

	test("should handle script attributes correctly", () => {
		const html = new HtmlBuilder({
			title: "Script Attributes Test",
		})
			.addHeaderScript({
				src: "https://example.com/script.js",
				async: true,
				defer: true,
				type: "module",
				integrity: "sha256-example",
				crossorigin: "anonymous",
			})
			.addFooterScript({
				content: `console.log("Footer script");`,
				type: "text/javascript",
			})
			.build()

		expect(html).toContain('src="https://example.com/script.js"')
		expect(html).toContain("async")
		expect(html).toContain("defer")
		expect(html).toContain('type="module"')
		expect(html).toContain('integrity="sha256-example"')
		expect(html).toContain('crossorigin="anonymous"')
		expect(html).toContain('type="text/javascript"')
		expect(html).toContain('console.log("Footer script");')
	})
})
