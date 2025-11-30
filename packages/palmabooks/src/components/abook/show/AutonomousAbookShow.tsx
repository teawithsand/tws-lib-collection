import {
	Abook,
	AbookEntry,
	AbookEntryDisposition,
	AbookEntrySourceType,
	WithId,
} from "@teawithsand/booklibr"
import { Timestamp } from "@teawithsand/lngext"
import { LoadingSuspenseBoundary } from "@teawithsand/mlui"
import { AbookShow } from "./AbookShow"

export interface AutonomousAbookShowProps {
	readonly id: string
}

const createMockAbook = (id: string): WithId<Abook> => {
	const entries = new Map<string, AbookEntry>()

	// Add some mock entries
	entries.set(
		"chapter-1",
		new AbookEntry({
			data: {
				createdAt: Timestamp.fromMillis(Date.UTC(2024, 0, 15, 10, 30)),
				name: "Chapter 1: Introduction",
				disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
				source: {
					type: AbookEntrySourceType.UPLOAD,
					uploadedAt: Timestamp.fromMillis(
						Date.UTC(2024, 0, 15, 10, 30),
					),
					uploadFileName: "chapter-1.mp3",
					uploadFileMime: "audio/mpeg",
				},
				ordinalNumber: 0,
			},
			aggregate: {
				metadata: null, // Keep it simple for mock
				blobSize: 25_600_000, // ~25MB
			},
		}),
	)

	entries.set(
		"chapter-2",
		new AbookEntry({
			data: {
				createdAt: Timestamp.fromMillis(Date.UTC(2024, 0, 15, 11, 0)),
				name: "Chapter 2: The Journey Begins",
				disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
				source: {
					type: AbookEntrySourceType.UPLOAD,
					uploadedAt: Timestamp.fromMillis(
						Date.UTC(2024, 0, 15, 11, 0),
					),
					uploadFileName: "chapter-2.mp3",
					uploadFileMime: "audio/mpeg",
				},
				ordinalNumber: 1,
			},
			aggregate: {
				metadata: null, // Keep it simple for mock
				blobSize: 30_200_000, // ~30MB
			},
		}),
	)

	entries.set(
		"chapter-3",
		new AbookEntry({
			data: {
				createdAt: Timestamp.fromMillis(Date.UTC(2024, 0, 15, 11, 30)),
				name: "Chapter 3: Challenges Ahead",
				disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
				source: {
					type: AbookEntrySourceType.UPLOAD,
					uploadedAt: Timestamp.fromMillis(
						Date.UTC(2024, 0, 15, 11, 30),
					),
					uploadFileName: "chapter-3.mp3",
					uploadFileMime: "audio/mpeg",
				},
				ordinalNumber: 2,
			},
			aggregate: {
				metadata: null, // Keep it simple for mock
				blobSize: 28_000_000, // ~28MB
			},
		}),
	)

	return {
		id,
		data: new Abook({
			data: {
				header: {
					createdAt: Timestamp.fromMillis(
						Date.UTC(2024, 0, 15, 9, 0),
					),
					metadata: {
						title: `Sample Audiobook ${id}`,
						description:
							"This is a sample audiobook created for demonstration purposes. It contains multiple chapters with various topics and serves as an example of how audiobooks are structured and displayed in the application. The story follows an epic adventure through unknown lands.",
						privateUserNote:
							"Really enjoying this book so far! The narrator has a great voice and the story is captivating. Started listening during my morning commute.",
					},
					position: {
						entryId: "chapter-2",
						entryOffsetMillis: 450000, // 7.5 minutes into chapter 2
						globalOffsetMillis: 2250000, // Total: 30min + 7.5min
					},
				},
				entries,
			},
			aggregate: {
				totalDurationMillis: 5850000, // Total: 97.5 minutes (30+35+32.5)
				totalEntries: 3,
			},
		}),
	}
}

export const AutonomousAbookShow = ({ id }: AutonomousAbookShowProps) => {
	const mockAbook = createMockAbook(id)

	return (
		<LoadingSuspenseBoundary>
			<AbookShow abook={mockAbook} />
		</LoadingSuspenseBoundary>
	)
}
