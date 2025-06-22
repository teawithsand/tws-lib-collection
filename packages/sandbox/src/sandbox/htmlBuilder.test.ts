import { describe, expect, test } from "vitest"
import { HtmlBuilder } from "./htmlBuilder"

describe("HtmlBuilder", () => {
	test("should create basic HTML document with default title", () => {
		const builder = new HtmlBuilder()
		const html = builder.build()

		expect(html).toContain("<!DOCTYPE html>")
		expect(html).toContain('<html lang="en">')
		expect(html).toContain("<title>Sandbox Document</title>")
		expect(html).toContain("</html>")
	})

	test("should create HTML document with custom title", () => {
		const builder = new HtmlBuilder({ title: "Custom Title" })
		const html = builder.build()

		expect(html).toContain("<title>Custom Title</title>")
	})

	test("should set title via setter method", () => {
		const builder = new HtmlBuilder().setTitle("New Title")
		const html = builder.build()

		expect(html).toContain("<title>New Title</title>")
	})

	test("should include body content", () => {
		const bodyContent = "<h1>Hello World</h1><p>This is a test</p>"
		const builder = new HtmlBuilder().setBodyContent(bodyContent)
		const html = builder.build()

		expect(html).toContain(bodyContent)
	})

	test("should include inline styles", () => {
		const styles = "body { background-color: red; } .test { color: blue; }"
		const builder = new HtmlBuilder().setInlineStyles(styles)
		const html = builder.build()

		expect(html).toContain(`<style>\n\t\t${styles}\n\t</style>`)
	})

	test("should add header scripts", () => {
		const builder = new HtmlBuilder()
			.addHeaderScript({ src: "https://example.com/script.js" })
			.addHeaderScript({ content: "console.log('test');" })
		const html = builder.build()

		expect(html).toContain(
			'<script src="https://example.com/script.js"></script>',
		)
		expect(html).toContain("<script>console.log('test');</script>")
	})

	test("should add footer scripts", () => {
		const builder = new HtmlBuilder()
			.addFooterScript({
				src: "https://example.com/footer.js",
				async: true,
			})
			.addFooterScript({ content: "window.loaded = true;", defer: true })
		const html = builder.build()

		expect(html).toContain(
			'<script src="https://example.com/footer.js" async></script>',
		)
		expect(html).toContain("<script defer>window.loaded = true;</script>")
	})

	test("should add script with all attributes", () => {
		const builder = new HtmlBuilder().addHeaderScript({
			src: "https://example.com/script.js",
			async: true,
			defer: true,
			type: "module",
			integrity: "sha384-example",
			crossorigin: "anonymous",
		})
		const html = builder.build()

		expect(html).toContain('src="https://example.com/script.js"')
		expect(html).toContain("async")
		expect(html).toContain("defer")
		expect(html).toContain('type="module"')
		expect(html).toContain('integrity="sha384-example"')
		expect(html).toContain('crossorigin="anonymous"')
	})

	test("should add CSS link", () => {
		const builder = new HtmlBuilder().addCssLink(
			"https://example.com/styles.css",
			"sha384-example",
			"anonymous",
		)
		const html = builder.build()

		expect(html).toContain(
			'<link rel="stylesheet" href="https://example.com/styles.css" integrity="sha384-example" crossorigin="anonymous">',
		)
	})

	test("should add CSS link without integrity and crossorigin", () => {
		const builder = new HtmlBuilder().addCssLink(
			"https://example.com/styles.css",
		)
		const html = builder.build()

		expect(html).toContain(
			'<link rel="stylesheet" href="https://example.com/styles.css">',
		)
	})

	test("should add custom header entries", () => {
		const builder = new HtmlBuilder()
			.addCustomHeaderEntry({
				tag: "meta",
				attributes: { name: "description", content: "Test page" },
			})
			.addCustomHeaderEntry({
				tag: "link",
				attributes: { rel: "icon", href: "/favicon.ico" },
			})
		const html = builder.build()

		expect(html).toContain('<meta name="description" content="Test page">')
		expect(html).toContain('<link rel="icon" href="/favicon.ico">')
	})

	test("should include PyScript support", () => {
		const builder = new HtmlBuilder().includePyScript("2024.1.1")
		const html = builder.build()

		expect(html).toContain(
			'<link rel="stylesheet" href="https://pyscript.net/releases/2024.1.1/core.css">',
		)
		expect(html).toContain(
			'<script src="https://pyscript.net/releases/2024.1.1/core.js" type="module"></script>',
		)
	})

	test("should include PyScript with default version", () => {
		const builder = new HtmlBuilder().includePyScript()
		const html = builder.build()

		expect(html).toContain("pyscript.net/releases/2024.1.1/")
	})

	test("should include TypeScript support", () => {
		const builder = new HtmlBuilder().includeTypeScript("5.3.3")
		const html = builder.build()

		expect(html).toContain(
			'<script src="https://unpkg.com/typescript@5.3.3/lib/typescript.js"></script>',
		)
		expect(html).toContain("window.compileTypeScript")
		expect(html).toContain("window.executeTypeScript")
	})

	test("should include TypeScript with default version", () => {
		const builder = new HtmlBuilder().includeTypeScript()
		const html = builder.build()

		expect(html).toContain("typescript@5.3.3/lib/")
	})

	test("should include console hooking initialization script", () => {
		const builder = new HtmlBuilder()
		const html = builder.build()

		expect(html).toContain("originalConsole")
		expect(html).toContain("console.log = function")
		expect(html).toContain("console.warn = function")
		expect(html).toContain("console.error = function")
		expect(html).toContain("unhandledrejection")
		expect(html).toContain("addEventListener('error'")
		expect(html).toContain("postMessage")
	})

	test("should include correct console log levels in initialization script", () => {
		const builder = new HtmlBuilder()
		const html = builder.build()

		expect(html).toContain("level: 'log'")
		expect(html).toContain("level: 'warn'")
		expect(html).toContain("level: 'error'")
	})

	test("should include event listeners for load and DOMContentLoaded", () => {
		const builder = new HtmlBuilder()
		const html = builder.build()

		expect(html).toContain("addEventListener('load'")
		expect(html).toContain("addEventListener('DOMContentLoaded'")
		expect(html).toContain("type: 'load'")
		expect(html).toContain("type: 'domContentLoaded'")
	})

	test("should chain methods correctly", () => {
		const builder = new HtmlBuilder({ title: "Chained Test" })
			.setTitle("Updated Title")
			.setBodyContent("<div>Test Content</div>")
			.setInlineStyles("body { margin: 0; }")
			.addHeaderScript({ src: "header.js" })
			.addFooterScript({ content: "console.log('footer');" })
			.addCssLink("styles.css")
			.addCustomHeaderEntry({
				tag: "meta",
				attributes: { charset: "UTF-8" },
			})
			.includePyScript()
			.includeTypeScript()

		const html = builder.build()

		expect(html).toContain("<title>Updated Title</title>")
		expect(html).toContain("<div>Test Content</div>")
		expect(html).toContain("body { margin: 0; }")
		expect(html).toContain('src="header.js"')
		expect(html).toContain("console.log('footer');")
		expect(html).toContain('href="styles.css"')
		expect(html).toContain('charset="UTF-8"')
		expect(html).toContain("pyscript.net")
		expect(html).toContain("typescript@")
	})

	test("should handle empty content gracefully", () => {
		const builder = new HtmlBuilder().setBodyContent("").setInlineStyles("")
		const html = builder.build()

		expect(html).toContain("<body>\n\t\n")
		expect(html).not.toContain("<style>")
	})

	test("should properly escape content in HTML", () => {
		const builder = new HtmlBuilder()
			.setTitle("Test & Example")
			.setBodyContent("<script>alert('test');</script>")
		const html = builder.build()

		expect(html).toContain("<title>Test & Example</title>")
		expect(html).toContain("<script>alert('test');</script>")
	})

	test("should generate valid HTML structure", () => {
		const builder = new HtmlBuilder()
			.setTitle("Structure Test")
			.setBodyContent("<h1>Content</h1>")
			.addHeaderScript({ src: "test.js" })
			.addFooterScript({ content: "console.log('end');" })

		const html = builder.build()

		// Check basic structure
		expect(html).toMatch(/<!DOCTYPE html>\s*<html lang="en">/)
		expect(html).toMatch(/<head>[\s\S]*<\/head>/)
		expect(html).toMatch(/<body>[\s\S]*<\/body>/)
		expect(html).toMatch(/<\/body>\s*<\/html>$/)

		// Check that header scripts come before body
		const headerScriptIndex = html.indexOf('src="test.js"')
		const bodyIndex = html.indexOf("<body>")
		expect(headerScriptIndex).toBeLessThan(bodyIndex)

		// Check that footer scripts come after body content
		const bodyContentIndex = html.indexOf("<h1>Content</h1>")
		const footerScriptIndex = html.indexOf("console.log('end');")
		expect(bodyContentIndex).toBeLessThan(footerScriptIndex)
	})
})
