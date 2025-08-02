import { describe, expect, test } from "vitest"
import { Path, PathParseError } from "./path"

/**
 * Unit tests for the Path utility class.
 */
describe("Path", () => {
	describe("parsing and normalization", () => {
		test("should normalize redundant slashes and dots", () => {
			const path = Path.parse("/foo//bar/./baz/../qux")
			expect(path.toString()).toBe("foo/bar/qux")
		})

		test("should handle empty path as current directory", () => {
			const path = Path.parse("")
			expect(path.toString()).toBe("")
		})

		test("should normalize various empty-equivalent paths to empty path", () => {
			const emptyPath = Path.parse("")
			const dotPath = Path.parse(".")
			const doubleDotPath = Path.parse("..")
			const multipleDotsPath = Path.parse("../..")
			const mixedPath = Path.parse("./.")
			const slashDotPath = Path.parse("/.")

			// All should result in empty path
			expect(emptyPath.toString()).toBe("")
			expect(dotPath.toString()).toBe("")
			expect(doubleDotPath.toString()).toBe("")
			expect(multipleDotsPath.toString()).toBe("")
			expect(mixedPath.toString()).toBe("")
			expect(slashDotPath.toString()).toBe("")

			// All should have empty segments
			expect(emptyPath.getSegments()).toEqual([])
			expect(dotPath.getSegments()).toEqual([])
			expect(doubleDotPath.getSegments()).toEqual([])
			expect(multipleDotsPath.getSegments()).toEqual([])
			expect(mixedPath.getSegments()).toEqual([])
			expect(slashDotPath.getSegments()).toEqual([])

			// All should be equal
			expect(emptyPath.equals(dotPath)).toBe(true)
			expect(emptyPath.equals(doubleDotPath)).toBe(true)
			expect(emptyPath.equals(multipleDotsPath)).toBe(true)
			expect(dotPath.equals(doubleDotPath)).toBe(true)
		})

		test("should normalize multiple consecutive slashes", () => {
			const doubleSlash = Path.parse("foo//bar")
			const tripleSlash = Path.parse("foo///bar")
			const multipleSlashes = Path.parse("foo////bar")
			const mixedSlashes = Path.parse("foo//bar///baz")

			// All should normalize to single slashes
			expect(doubleSlash.toString()).toBe("foo/bar")
			expect(tripleSlash.toString()).toBe("foo/bar")
			expect(multipleSlashes.toString()).toBe("foo/bar")
			expect(mixedSlashes.toString()).toBe("foo/bar/baz")

			// All should have the same segments
			expect(doubleSlash.getSegments()).toEqual(["foo", "bar"])
			expect(tripleSlash.getSegments()).toEqual(["foo", "bar"])
			expect(multipleSlashes.getSegments()).toEqual(["foo", "bar"])
			expect(mixedSlashes.getSegments()).toEqual(["foo", "bar", "baz"])

			// All should be equal
			expect(doubleSlash.equals(tripleSlash)).toBe(true)
			expect(doubleSlash.equals(multipleSlashes)).toBe(true)
			expect(tripleSlash.equals(multipleSlashes)).toBe(true)
		})

		test("should handle leading and trailing multiple slashes", () => {
			const leadingDoubleSlash = Path.parse("//foo/bar")
			const trailingDoubleSlash = Path.parse("foo/bar//")
			const bothDoubleSlashes = Path.parse("//foo/bar//")
			const manyLeadingSlashes = Path.parse("////foo")
			const manyTrailingSlashes = Path.parse("foo////")

			// Leading slashes should be stripped
			expect(leadingDoubleSlash.toString()).toBe("foo/bar")
			expect(leadingDoubleSlash.getSegments()).toEqual(["foo", "bar"])

			// Trailing slashes should be stripped
			expect(trailingDoubleSlash.toString()).toBe("foo/bar")
			expect(trailingDoubleSlash.getSegments()).toEqual(["foo", "bar"])

			// Both leading and trailing slashes should be stripped
			expect(bothDoubleSlashes.toString()).toBe("foo/bar")
			expect(bothDoubleSlashes.getSegments()).toEqual(["foo", "bar"])

			// Many leading slashes should be stripped
			expect(manyLeadingSlashes.toString()).toBe("foo")
			expect(manyLeadingSlashes.getSegments()).toEqual(["foo"])

			// Many trailing slashes should be stripped
			expect(manyTrailingSlashes.toString()).toBe("foo")
			expect(manyTrailingSlashes.getSegments()).toEqual(["foo"])
		})

		test("should handle only slashes as empty path", () => {
			const onlySlashes = Path.parse("//")
			const manySlashes = Path.parse("////")
			const evenMoreSlashes = Path.parse("//////")

			// All should result in empty path
			expect(onlySlashes.toString()).toBe("")
			expect(manySlashes.toString()).toBe("")
			expect(evenMoreSlashes.toString()).toBe("")

			// All should have empty segments
			expect(onlySlashes.getSegments()).toEqual([])
			expect(manySlashes.getSegments()).toEqual([])
			expect(evenMoreSlashes.getSegments()).toEqual([])

			// All should be equal to empty path
			const emptyPath = Path.parse("")
			expect(onlySlashes.equals(emptyPath)).toBe(true)
			expect(manySlashes.equals(emptyPath)).toBe(true)
			expect(evenMoreSlashes.equals(emptyPath)).toBe(true)
		})

		test("should handle complex combinations of multiple slashes with dots and parent navigation", () => {
			const complexPath1 = Path.parse("foo///bar//./baz///../qux")
			const complexPath2 = Path.parse("///foo//bar/././../baz////")
			const complexPath3 = Path.parse("///..//..//foo//bar///")

			// Should normalize correctly
			expect(complexPath1.toString()).toBe("foo/bar/qux")
			expect(complexPath1.getSegments()).toEqual(["foo", "bar", "qux"])

			// foo/bar/././.. should resolve to foo, then /baz gives foo/baz
			expect(complexPath2.toString()).toBe("foo/baz")
			expect(complexPath2.getSegments()).toEqual(["foo", "baz"])

			expect(complexPath3.toString()).toBe("foo/bar")
			expect(complexPath3.getSegments()).toEqual(["foo", "bar"])
		})
	})

	describe("path manipulation", () => {
		describe("join", () => {
			test("should join segments correctly", () => {
				const path = Path.parse("foo").join("bar", "baz")
				expect(path.toString()).toBe("foo/bar/baz")
			})
		})

		describe("concat", () => {
			test("should concatenate paths correctly", () => {
				const path1 = Path.parse("foo")
				const path2 = Path.parse("bar/baz")
				const result = path1.concat(path2)
				expect(result.toString()).toBe("foo/bar/baz")
			})

			test("should concatenate with string", () => {
				const path = Path.parse("foo")
				const result = path.concat("bar/baz")
				expect(result.toString()).toBe("foo/bar/baz")
			})
		})
	})

	describe("parent path", () => {
		test("should return parent path for multi-segment paths", () => {
			const path = Path.parse("foo/bar/baz")
			const parent = path.parent()
			expect(parent?.toString()).toBe("foo/bar")
		})

		test("should return null parent for root path", () => {
			const path = Path.parse("")
			const parent = path.parent()
			expect(parent).toBeNull()
		})

		test("should return null when taking parent of empty path", () => {
			const emptyPath = Path.parse("")
			const parent = emptyPath.parent()
			expect(parent).toBeNull()
		})

		test.skip("should handle single segment path parent correctly", () => {
			const singleSegmentPath = Path.parse("file.txt")
			const parent = singleSegmentPath.parent()
			expect(parent).not.toBeNull()
			expect(parent?.toString()).toBe(".")
			expect(parent?.getSegments()).toEqual([])
		})
	})

	describe("basename", () => {
		test("should return basename for multi-segment paths", () => {
			const path = Path.parse("foo/bar/baz")
			expect(path.basename()).toBe("baz")
		})

		test("should return null basename for root", () => {
			const path = Path.parse("")
			expect(path.basename()).toBeNull()
		})

		test("should return basename for single segment", () => {
			const path = Path.parse("file.txt")
			expect(path.basename()).toBe("file.txt")
		})
	})

	describe("path properties", () => {
		describe("segments", () => {
			test("should return correct segments", () => {
				const path = Path.parse("foo/bar/baz")
				expect(path.getSegments()).toEqual(["foo", "bar", "baz"])
			})

			test("should return empty array for empty path", () => {
				const path = Path.parse("")
				expect(path.getSegments()).toEqual([])
			})
		})

		describe("toString", () => {
			test("should return correct string representation", () => {
				const path = Path.parse("foo/bar/baz")
				expect(path.toString()).toBe("foo/bar/baz")
			})

			test("should return empty string for empty path", () => {
				const path = Path.parse("")
				expect(path.toString()).toBe("")
			})
		})

		describe("isAbsolutePath", () => {
			test("should always return false", () => {
				const path1 = Path.parse("foo/bar")
				const path2 = Path.parse("/foo/bar")
				const path3 = Path.parse("")
				expect(path1.isAbsolutePath()).toBe(false)
				expect(path2.isAbsolutePath()).toBe(false)
				expect(path3.isAbsolutePath()).toBe(false)
			})
		})
	})

	describe("equality", () => {
		test("should compare paths for equality", () => {
			const a = Path.parse("foo/bar")
			const b = Path.parse("foo/bar")
			const c = Path.parse("foo/baz")
			expect(a.equals(b)).toBe(true)
			expect(a.equals(c)).toBe(false)
		})

		test("should handle empty paths equality", () => {
			const a = Path.parse("")
			const b = Path.parse("")
			const c = Path.parse("foo")
			expect(a.equals(b)).toBe(true)
			expect(a.equals(c)).toBe(false)
		})
	})

	describe("static factory methods", () => {
		describe("resolve", () => {
			test("should resolve multiple segments", () => {
				const path = Path.resolve("foo", "bar", "..", "baz")
				expect(path.toString()).toBe("foo/baz")
			})

			test("should handle empty segments", () => {
				const path = Path.resolve()
				expect(path.toString()).toBe("")
			})
		})

		describe("fromSegment", () => {
			test("should create path from single segment", () => {
				const path = Path.fromSegment("example")
				expect(path.toString()).toBe("example")
				expect(path.getSegments()).toEqual(["example"])
			})

			test("should handle segment containing slash", () => {
				expect(() => Path.fromSegment("foo/bar")).toThrow(
					PathParseError,
				)
				expect(() => Path.fromSegment("foo/bar")).toThrow(
					'Segment cannot contain "/": foo/bar',
				)
			})

			test("should handle segment with multiple slashes", () => {
				expect(() => Path.fromSegment("foo/bar/baz")).toThrow(
					PathParseError,
				)
				expect(() => Path.fromSegment("foo/bar/baz")).toThrow(
					'Segment cannot contain "/": foo/bar/baz',
				)
			})

			test("should handle segment with leading slash", () => {
				expect(() => Path.fromSegment("/foo")).toThrow(PathParseError)
				expect(() => Path.fromSegment("/foo")).toThrow(
					'Segment cannot contain "/": /foo',
				)
			})

			test("should handle segment with trailing slash", () => {
				expect(() => Path.fromSegment("foo/")).toThrow(PathParseError)
				expect(() => Path.fromSegment("foo/")).toThrow(
					'Segment cannot contain "/": foo/',
				)
			})
		})

		describe("fromSegments", () => {
			test("should create path from array of segments", () => {
				const path = Path.fromSegments(["foo", "bar", "baz"])
				expect(path.toString()).toBe("foo/bar/baz")
				expect(path.getSegments()).toEqual(["foo", "bar", "baz"])
			})

			test("should handle empty segments array", () => {
				const path = Path.fromSegments([])
				expect(path.toString()).toBe("")
				expect(path.getSegments()).toEqual([])
			})

			test("should handle segments containing slashes", () => {
				expect(() => Path.fromSegments(["foo/bar", "baz"])).toThrow(
					PathParseError,
				)
				expect(() => Path.fromSegments(["foo/bar", "baz"])).toThrow(
					'Segment at index 0 cannot contain "/": foo/bar',
				)
			})

			test("should handle segments with multiple slashes", () => {
				expect(() =>
					Path.fromSegments(["foo/bar/baz", "qux/quux"]),
				).toThrow(PathParseError)
				expect(() =>
					Path.fromSegments(["foo/bar/baz", "qux/quux"]),
				).toThrow('Segment at index 0 cannot contain "/": foo/bar/baz')
			})

			test("should handle segments with leading and trailing slashes", () => {
				expect(() => Path.fromSegments(["/foo/", "/bar/baz/"])).toThrow(
					PathParseError,
				)
				expect(() => Path.fromSegments(["/foo/", "/bar/baz/"])).toThrow(
					'Segment at index 0 cannot contain "/": /foo/',
				)
			})

			test("should handle empty string segments", () => {
				const path = Path.fromSegments(["foo", "", "bar"])
				expect(path.toString()).toBe("foo/bar")
				expect(path.getSegments()).toEqual(["foo", "bar"])
			})

			test("should handle segments with dots", () => {
				const path = Path.fromSegments(["foo", ".", "bar", "..", "baz"])
				expect(path.toString()).toBe("foo/baz")
				expect(path.getSegments()).toEqual(["foo", "baz"])
			})

			test("should throw for second segment containing slash", () => {
				expect(() =>
					Path.fromSegments(["foo", "bar/baz", "qux"]),
				).toThrow(PathParseError)
				expect(() =>
					Path.fromSegments(["foo", "bar/baz", "qux"]),
				).toThrow('Segment at index 1 cannot contain "/": bar/baz')
			})

			test("should allow empty string segments", () => {
				const path = Path.fromSegments(["foo", "", "bar"])
				expect(path.toString()).toBe("foo/bar")
				expect(path.getSegments()).toEqual(["foo", "bar"])
			})

			test("should throw even for single slash segment", () => {
				expect(() => Path.fromSegments(["/"])).toThrow(PathParseError)
				expect(() => Path.fromSegments(["/"])).toThrow(
					'Segment at index 0 cannot contain "/": /',
				)
			})
		})

		describe("parse", () => {
			test("should parse simple paths", () => {
				const path = Path.parse("foo/bar")
				expect(path.toString()).toBe("foo/bar")
			})

			test("should handle complex normalization", () => {
				const path = Path.parse("foo/../bar/./baz")
				expect(path.toString()).toBe("bar/baz")
			})
		})

		describe("from (deprecated)", () => {
			test("should work same as parse", () => {
				const path1 = Path.from("foo/bar")
				const path2 = Path.parse("foo/bar")
				expect(path1.equals(path2)).toBe(true)
			})
		})
	})
})
