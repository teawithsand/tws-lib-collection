import { describe, expect, test } from "vitest"
import { Path } from "./path"

/**
 * Unit tests for the Path utility class.
 */
describe("Path", () => {
	test("should normalize redundant slashes and dots", () => {
		const path = new Path("/foo//bar/./baz/../qux")
		expect(path.toString()).toBe("foo/bar/qux")
	})

	test("should handle empty path as current directory", () => {
		const path = new Path("")
		expect(path.toString()).toBe("")
	})

	test("should join segments correctly", () => {
		const path = new Path("foo").join("bar", "baz")
		expect(path.toString()).toBe("foo/bar/baz")
	})

	test("should return parent path", () => {
		const path = new Path("foo/bar/baz")
		const parent = path.parent()
		expect(parent?.toString()).toBe("foo/bar")
	})

	test("should return null parent for root path", () => {
		const path = new Path("")
		const parent = path.parent()
		expect(parent?.toString()).toBe("..")
	})

	test("should return basename", () => {
		const path = new Path("foo/bar/baz")
		expect(path.basename()).toBe("baz")
	})

	test("should return null basename for root", () => {
		const path = new Path("")
		expect(path.basename()).toBeNull()
	})

	test("should compare paths for equality", () => {
		const a = new Path("foo/bar")
		const b = new Path("foo/bar")
		const c = new Path("foo/baz")
		expect(a.equals(b)).toBe(true)
		expect(a.equals(c)).toBe(false)
	})

	test("should resolve multiple segments", () => {
		const path = Path.resolve("foo", "bar", "..", "baz")
		expect(path.toString()).toBe("foo/baz")
	})
})
