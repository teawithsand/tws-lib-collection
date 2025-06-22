import { ConsoleLogLevel } from "./childMessage"

/**
 * Interface for custom header entries like CSS links
 */
export interface CustomHeaderEntry {
	tag: string
	attributes: Record<string, string>
}

/**
 * Interface for script entries
 */
export interface ScriptEntry {
	src?: string
	content?: string
	async?: boolean
	defer?: boolean
	type?: string
	integrity?: string
	crossorigin?: string
}

/**
 * Builder class for creating HTML documents with sandbox message integration
 */
export class HtmlBuilder {
	private title = "Sandbox Document"
	private bodyContent = ""
	private inlineStyles = ""
	private headerScripts: ScriptEntry[] = []
	private footerScripts: ScriptEntry[] = []
	private customHeaderEntries: CustomHeaderEntry[] = []

	/**
	 * Creates a new HtmlBuilder instance
	 * @param options - Initial configuration options
	 */
	constructor({ title = "Sandbox Document" }: { title?: string } = {}) {
		this.title = title
	}

	/**
	 * Sets the document title
	 */
	public readonly setTitle = (title: string): this => {
		this.title = title
		return this
	}

	/**
	 * Sets the body content
	 */
	public readonly setBodyContent = (content: string): this => {
		this.bodyContent = content
		return this
	}

	/**
	 * Sets inline styles for the document
	 */
	public readonly setInlineStyles = (styles: string): this => {
		this.inlineStyles = styles
		return this
	}

	/**
	 * Adds a script to the header
	 */
	public readonly addHeaderScript = (script: ScriptEntry): this => {
		this.headerScripts.push(script)
		return this
	}

	/**
	 * Adds a script to the footer
	 */
	public readonly addFooterScript = (script: ScriptEntry): this => {
		this.footerScripts.push(script)
		return this
	}

	/**
	 * Adds a custom header entry (like CSS links, meta tags, etc.)
	 */
	public readonly addCustomHeaderEntry = (entry: CustomHeaderEntry): this => {
		this.customHeaderEntries.push(entry)
		return this
	}

	/**
	 * Adds a CSS stylesheet link to the header
	 */
	public readonly addCssLink = (
		href: string,
		integrity?: string,
		crossorigin?: string,
	): this => {
		const attributes: Record<string, string> = {
			rel: "stylesheet",
			href,
		}

		if (integrity) {
			attributes["integrity"] = integrity
		}

		if (crossorigin) {
			attributes["crossorigin"] = crossorigin
		}

		return this.addCustomHeaderEntry({
			tag: "link",
			attributes,
		})
	}

	/**
	 * Includes PyScript support by adding necessary scripts and stylesheets
	 */
	public readonly includePyScript = (version = "2024.1.1"): this => {
		// Add PyScript CSS
		this.addCssLink(`https://pyscript.net/releases/${version}/core.css`)

		// Add PyScript core script
		this.addHeaderScript({
			src: `https://pyscript.net/releases/${version}/core.js`,
			type: "module",
		})

		return this
	}

	/**
	 * Includes TypeScript support via TypeScript compiler in the browser
	 */
	public readonly includeTypeScript = (version = "5.3.3"): this => {
		// Add TypeScript compiler
		this.addHeaderScript({
			src: `https://unpkg.com/typescript@${version}/lib/typescript.js`,
		})

		// Add TypeScript compilation utility
		this.addFooterScript({
			content: `
				// TypeScript compilation utility
				window.compileTypeScript = function(code, options = {}) {
					if (typeof ts === 'undefined') {
						throw new Error('TypeScript compiler not loaded');
					}
					
					const defaultOptions = {
						target: ts.ScriptTarget.ES2020,
						module: ts.ModuleKind.ES2020,
						strict: true,
						esModuleInterop: true,
						skipLibCheck: true,
						forceConsistentCasingInFileNames: true
					};
					
					const compilerOptions = { ...defaultOptions, ...options };
					const result = ts.transpile(code, compilerOptions);
					return result;
				};

				// Execute TypeScript code
				window.executeTypeScript = function(code, options = {}) {
					try {
						const compiled = window.compileTypeScript(code, options);
						return eval(compiled);
					} catch (error) {
						console.error('TypeScript execution error:', error);
						throw error;
					}
				};
			`,
		})

		return this
	}

	/**
	 * Generates the initialization script that hooks into console methods and error events
	 */
	private readonly generateInitializationScript = (): string => {
		return `
			(function() {
				'use strict';
				
				// Store original console methods
				const originalConsole = {
					log: console.log.bind(console),
					warn: console.warn.bind(console),
					error: console.error.bind(console)
				};

				// Helper function to serialize arguments
				function serializeArgs(args) {
					return Array.from(args).map(arg => {
						try {
							if (arg === null) return null;
							if (arg === undefined) return undefined;
							if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
								return arg;
							}
							if (arg instanceof Error) {
								return {
									name: arg.name,
									message: arg.message,
									stack: arg.stack
								};
							}
							// For objects, try to stringify them
							return JSON.parse(JSON.stringify(arg));
						} catch (e) {
							// If serialization fails, return string representation
							return String(arg);
						}
					});
				}

				// Function to send message to parent
				function sendMessage(message) {
					if (window.parent && window.parent !== window) {
						window.parent.postMessage(message, '*');
					}
				}

				// Hook console methods
				console.log = function(...args) {
					originalConsole.log(...args);
					sendMessage({
						type: 'console',
						level: '${ConsoleLogLevel.LOG}',
						args: serializeArgs(args),
						timestamp: Date.now()
					});
				};

				console.warn = function(...args) {
					originalConsole.warn(...args);
					sendMessage({
						type: 'console',
						level: '${ConsoleLogLevel.WARN}',
						args: serializeArgs(args),
						timestamp: Date.now()
					});
				};

				console.error = function(...args) {
					originalConsole.error(...args);
					sendMessage({
						type: 'console',
						level: '${ConsoleLogLevel.ERROR}',
						args: serializeArgs(args),
						timestamp: Date.now()
					});
				};

				// Hook unhandled promise rejections
				window.addEventListener('unhandledrejection', function(event) {
					let reason;
					try {
						if (event.reason instanceof Error) {
							reason = {
								name: event.reason.name,
								message: event.reason.message,
								stack: event.reason.stack
							};
						} else {
							reason = serializeArgs([event.reason])[0];
						}
					} catch (e) {
						reason = String(event.reason);
					}

					sendMessage({
						type: 'unhandledRejection',
						reason: reason,
						promise: event.promise ? String(event.promise) : undefined,
						timestamp: Date.now()
					});
				});

				// Hook unhandled errors
				window.addEventListener('error', function(event) {
					sendMessage({
						type: 'unhandledError',
						message: event.message || 'Unknown error',
						filename: event.filename || undefined,
						stack: event.error && event.error.stack ? event.error.stack : undefined,
						timestamp: Date.now()
					});
				});

				// Send load event
				window.addEventListener('load', function() {
					sendMessage({
						type: 'load',
						timestamp: Date.now()
					});
				});

				// Send DOM content loaded event
				document.addEventListener('DOMContentLoaded', function() {
					sendMessage({
						type: 'domContentLoaded',
						timestamp: Date.now()
					});
				});

				// Also send load event immediately if document is already loaded
				if (document.readyState === 'complete') {
					sendMessage({
						type: 'load',
						timestamp: Date.now()
					});
				} else if (document.readyState === 'interactive') {
					sendMessage({
						type: 'domContentLoaded',
						timestamp: Date.now()
					});
				}
			})();
		`
	}

	/**
	 * Generates a script tag from a ScriptEntry
	 */
	private readonly generateScriptTag = (script: ScriptEntry): string => {
		const attributes: string[] = []

		if (script.src) {
			attributes.push(`src="${script.src}"`)
		}

		if (script.async) {
			attributes.push("async")
		}

		if (script.defer) {
			attributes.push("defer")
		}

		if (script.type) {
			attributes.push(`type="${script.type}"`)
		}

		if (script.integrity) {
			attributes.push(`integrity="${script.integrity}"`)
		}

		if (script.crossorigin) {
			attributes.push(`crossorigin="${script.crossorigin}"`)
		}

		const attributeString =
			attributes.length > 0 ? ` ${attributes.join(" ")}` : ""
		const content = script.content || ""

		return `<script${attributeString}>${content}</script>`
	}

	/**
	 * Generates a custom header entry tag
	 */
	private readonly generateCustomHeaderTag = (
		entry: CustomHeaderEntry,
	): string => {
		const attributeStrings = Object.entries(entry.attributes)
			.map(([key, value]) => `${key}="${value}"`)
			.join(" ")

		return `<${entry.tag}${attributeStrings ? ` ${attributeStrings}` : ""}>`
	}

	/**
	 * Builds and returns the complete HTML document
	 */
	public readonly build = (): string => {
		const headerScriptTags = this.headerScripts
			.map((script) => this.generateScriptTag(script))
			.join("\n\t\t")
		const footerScriptTags = this.footerScripts
			.map((script) => this.generateScriptTag(script))
			.join("\n\t\t")
		const customHeaderTags = this.customHeaderEntries
			.map((entry) => this.generateCustomHeaderTag(entry))
			.join("\n\t\t")
		const initScript = this.generateInitializationScript()

		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${this.title}</title>
	${this.inlineStyles ? `<style>\n\t\t${this.inlineStyles}\n\t</style>` : ""}
	${customHeaderTags ? `${customHeaderTags}` : ""}

	<script>
		${initScript}
	</script>
	${headerScriptTags ? `${headerScriptTags}` : ""}
</head>
<body>
	${this.bodyContent}
	${footerScriptTags ? `${footerScriptTags}` : ""}
</body>
</html>`
	}
}
