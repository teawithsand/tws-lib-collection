/**
 * Entry source types example
 *
 * This example demonstrates the different source types for audiobook entries:
 * - UPLOAD: Files uploaded by the user
 * - URL: Remote files referenced by URL
 */

import { Timestamp } from "@teawithsand/lngext"
import {
	AbookEntrySourceFull,
	AbookEntrySourceLite,
	AbookEntrySourceType,
	AbookEntrySourceUtil,
} from "../src"

const main = () => {
	// 1. Upload source - full version with all metadata
	const uploadSource: AbookEntrySourceFull = {
		type: AbookEntrySourceType.UPLOAD,
		uploadedAt: Timestamp.fromDate(new Date()),
		uploadFileName: "audiobook-chapter.mp3",
		uploadFileMime: "audio/mpeg",
	}

	// 2. URL source - reference to remote file
	const urlSource: AbookEntrySourceFull = {
		type: AbookEntrySourceType.URL,
		url: "https://example.com/audiobooks/chapter1.mp3",
	}

	// 3. Convert full source to lite source (strips metadata)
	const uploadSourceLite: AbookEntrySourceLite =
		AbookEntrySourceUtil.toLite(uploadSource)
	const urlSourceLite: AbookEntrySourceLite =
		AbookEntrySourceUtil.toLite(urlSource)

	console.log("Upload source (full):", JSON.stringify(uploadSource, null, 2))
	console.log("Upload source (lite):", JSON.stringify(uploadSourceLite))
	console.log("\nURL source (full):", JSON.stringify(urlSource))
	console.log("URL source (lite):", JSON.stringify(urlSourceLite))

	// 4. Type narrowing example
	const handleSource = (source: AbookEntrySourceFull) => {
		switch (source.type) {
			case AbookEntrySourceType.UPLOAD:
				console.log(
					`\nHandling uploaded file: ${source.uploadFileName}`,
				)
				console.log(
					`  Uploaded at: ${new Date(source.uploadedAt.toNumberMillis()).toISOString()}`,
				)
				console.log(`  MIME type: ${source.uploadFileMime}`)
				break
			case AbookEntrySourceType.URL:
				console.log(`\nHandling URL source: ${source.url}`)
				break
		}
	}

	handleSource(uploadSource)
	handleSource(urlSource)
}

main()
