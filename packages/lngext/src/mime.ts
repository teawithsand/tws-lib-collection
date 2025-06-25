import { BaseError, Errors } from "./error"
import { TypeAssert } from "./typeAssert"

export const MimeError = Errors.makeErrorType("MimeError", BaseError)

const extensionToMime: Record<string, string> = Object.fromEntries(
	Object.entries({
		atom: "application/atom+xml",
		avif: "image/avif",
		bmp: "image/x-ms-bmp",
		css: "text/css",
		gif: "image/gif",
		htm: "text/html",
		html: "text/html",
		ico: "image/x-icon",
		jng: "image/x-jng",
		jpeg: "image/jpeg",
		jpg: "image/jpeg",
		js: "application/javascript",
		json: "application/json",
		m4a: "audio/x-m4a",
		mp3: "audio/mpeg",
		ogg: "audio/ogg",
		pdf: "application/pdf",
		png: "image/png",
		rss: "application/rss+xml",
		svg: "image/svg+xml",
		tif: "image/tiff",
		tiff: "image/tiff",
		txt: "text/plain",
		wasm: "application/wasm",
		webp: "image/webp",
		xhtml: "application/xhtml+xml",
		xml: "text/xml",
	}),
)

/**
 * Wrapper for mime types.
 */
export class Mime {
	public static readonly fromString = (txt: string): Mime => {
		const parts = txt.toLowerCase().split("/")
		if (parts.length !== 2) {
			throw new MimeError("Bad mime string provided: " + txt)
		}
		const [majorRaw, minorRaw] = parts
		if (typeof majorRaw !== "string" || typeof minorRaw !== "string") {
			throw new MimeError("Bad mime string provided: " + txt)
		}
		const major = majorRaw
		const minor = minorRaw
		if (!/^[a-z]+$/.test(major) || !/^[a-z]+$/.test(minor)) {
			throw new MimeError("Bad mime string provided: " + txt)
		}
		return new Mime(major, minor)
	}

	public static readonly fromExtension = (ext: string): Mime | null => {
		if (ext.startsWith(".")) {
			ext = ext.slice(1)
		}

		const res = extensionToMime[ext]
		if (!res) return null
		return Mime.fromString(res)
	}

	public static readonly fromFileName = (name: string) => {
		name = name.replace(/^\.*/, "")
		const [_first, ...rest] = name.split(".")
		const ext = rest.join(".")

		return Mime.fromExtension(ext)
	}

	/**
	 * @param major General type of data, like image
	 * @param minor Specific type of data like jpeg
	 */
	constructor(
		public readonly major: string,
		public readonly minor: string,
	) {}

	equals = (other: Mime): boolean => {
		return other.minor === this.minor && other.major == this.major
	}

	toString() {
		return this.major + "/" + this.minor
	}

	public static readonly PNG =
		Mime.fromString("image/png") ?? TypeAssert.unreachable()
	public static readonly JPEG =
		Mime.fromString("image/jpeg") ?? TypeAssert.unreachable()
	public static readonly GIF =
		Mime.fromString("image/gif") ?? TypeAssert.unreachable()
	public static readonly WEBP =
		Mime.fromString("image/webp") ?? TypeAssert.unreachable()
	public static readonly AVIF =
		Mime.fromString("image/avif") ?? TypeAssert.unreachable()
	public static readonly MP3 =
		Mime.fromExtension("mp3") ?? TypeAssert.unreachable()
	public static readonly OGG =
		Mime.fromExtension("ogg") ?? TypeAssert.unreachable()
	public static readonly BINARY =
		Mime.fromString("application/binary") ?? TypeAssert.unreachable()
	public static readonly TEXT =
		Mime.fromExtension("txt") ?? TypeAssert.unreachable()
}
