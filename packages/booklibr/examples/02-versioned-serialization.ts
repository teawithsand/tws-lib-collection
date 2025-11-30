/**
 * Versioned type serialization example
 *
 * This example demonstrates how booklibr uses versioned types for data persistence.
 * Versioned types allow schema evolution while maintaining backward compatibility.
 */

import { Timestamp } from "@teawithsand/lngext"
import {
	AbookEntryData,
	AbookEntryDataVersionedType,
	AbookEntryDisposition,
	AbookEntrySourceType,
} from "../src"

const main = () => {
	// 1. Create an AbookEntryData object
	const entryData: AbookEntryData = {
		createdAt: Timestamp.fromNumber(1672531200000), // 2023-01-01
		name: "Introduction",
		disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
		ordinalNumber: 1,
		source: {
			type: AbookEntrySourceType.UPLOAD,
			uploadedAt: Timestamp.fromNumber(1672531200000),
			uploadFileName: "intro.mp3",
			uploadFileMime: "audio/mpeg",
		},
	}

	// 2. Serialize the data (converts Timestamp to number, enums to strings)
	const serialized = AbookEntryDataVersionedType.serialize(entryData)
	console.log("Serialized version:", serialized.version)
	console.log("Serialized data:", JSON.stringify(serialized.data, null, 2))

	// 3. Deserialize back to the owned type
	const deserializer = AbookEntryDataVersionedType.getUnknownSerializer()
	const deserialized = deserializer.deserialize(serialized)

	console.log("\nDeserialized entry:")
	console.log("  Name:", deserialized.name)
	console.log(
		"  Created at:",
		new Date(deserialized.createdAt.toNumberMillis()).toISOString(),
	)
	console.log("  Disposition:", deserialized.disposition)

	// 4. Demonstrate that Timestamp objects work correctly
	if (deserialized.source.type === AbookEntrySourceType.UPLOAD) {
		console.log(
			"  Uploaded at:",
			new Date(
				deserialized.source.uploadedAt.toNumberMillis(),
			).toISOString(),
		)
	}
}

main()
