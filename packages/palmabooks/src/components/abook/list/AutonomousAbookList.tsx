import {
	Abook,
	AbookEntry,
	AbookEntryDisposition,
	AbookEntrySourceType,
	WithId,
} from "@teawithsand/booklibr"
import { atom } from "@teawithsand/fstate"
import { Timestamp } from "@teawithsand/lngext"
import { AbookList } from "./AbookList"

const mockedAbooks: Abook[] = [
	new Abook({
		data: {
			header: {
				createdAt: Timestamp.fromMillis(Date.UTC(2024, 0, 12, 8, 30)),
				metadata: {
					title: "The Art of Async",
					description: "Deep dive into async programming patterns.",
					privateUserNote: "Revisit chapter 3 for coroutine tips.",
				},
				position: {
					entryId: "chapter-1",
					entryOffsetMillis: 120000,
					globalOffsetMillis: 120000,
				},
			},
			entries: new Map([
				[
					"chapter-1",
					new AbookEntry({
						data: {
							createdAt: Timestamp.fromMillis(
								Date.UTC(2024, 0, 10, 15),
							),
							name: "Chapter 1: Futures",
							disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
							source: {
								type: AbookEntrySourceType.UPLOAD,
								uploadedAt: Date.UTC(2024, 0, 11, 9, 45),
								uploadFileName: "chapter-1.mp3",
								uploadFileMime: "audio/mpeg",
							},
							ordinalNumber: 0,
						},
						aggregate: {
							metadata: null,
							blobSize: 18_432_000,
						},
					}),
				],
			]),
		},
		aggregate: {
			totalDurationMillis: 2_700_000,
			totalEntries: 1,
		},
	}),
	new Abook({
		data: {
			header: {
				createdAt: Timestamp.fromMillis(Date.UTC(2023, 10, 5, 19, 15)),
				metadata: {
					title: "Dungeon Design Journal",
					description:
						"Notes on crafting immersive tabletop adventures.",
					privateUserNote: "Perfect ambiance for weekend prep.",
				},
				position: null,
			},
			entries: new Map([
				[
					"ambient-track",
					new AbookEntry({
						data: {
							createdAt: Timestamp.fromMillis(
								Date.UTC(2023, 10, 4, 21),
							),
							name: "Ambient Cavern Loop",
							disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
							source: {
								type: AbookEntrySourceType.URL,
								url: "https://cdn.example.com/audio/ambient-cavern.mp3",
							},
							ordinalNumber: 0,
						},
						aggregate: {
							metadata: null,
							blobSize: null,
						},
					}),
				],
			]),
		},
		aggregate: {
			totalDurationMillis: 3_600_000,
			totalEntries: 1,
		},
	}),
	new Abook({
		data: {
			header: {
				createdAt: Timestamp.fromMillis(Date.UTC(2022, 5, 22, 6)),
				metadata: {
					title: "Coffee Roaster Stories",
					description:
						"Founder interviews from independent roasters.",
					privateUserNote: "Share episode 2 with Alex.",
				},
				position: null,
			},
			entries: new Map(),
		},
		aggregate: {
			totalDurationMillis: -1,
			totalEntries: 0,
		},
	}),
]

const mockedAbooksWithId: WithId<Abook>[] = mockedAbooks.map(
	(abook, index) => ({
		id: `mocked-abook-${index + 1}`,
		data: abook,
	}),
)

const mockedAbooksAtom = atom(Promise.resolve(mockedAbooksWithId))

export const AutonomousAbookList = () => {
	return <AbookList abooksAtom={mockedAbooksAtom} />
}
