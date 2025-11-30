import type { Meta, StoryObj } from "@storybook/react"
import {
	Abook,
	AbookEntry,
	AbookEntryDisposition,
	AbookEntrySourceType,
	WithId,
} from "@teawithsand/booklibr"
import { atom } from "@teawithsand/fstate"
import { Timestamp } from "@teawithsand/lngext"
import { Container } from "@teawithsand/mlui"
import { AbookList } from "./AbookList"

// Mock data helpers
const createMockAbook = (
	title: string,
	description: string,
	id: string,
	options: {
		hasEntries?: boolean
		totalDurationMillis?: number
		createdAt?: number
		position?: boolean
	} = {},
): WithId<Abook> => {
	const entries = new Map()

	if (options.hasEntries !== false) {
		entries.set(
			"chapter-1",
			new AbookEntry({
				data: {
					createdAt: Timestamp.fromMillis(Date.UTC(2024, 0, 10, 15)),
					name: "Chapter 1",
					disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
					source: {
						type: AbookEntrySourceType.UPLOAD,
						uploadedAt: Timestamp.fromMillis(
							Date.UTC(2024, 0, 11, 9, 45),
						),
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
		)
	}

	return {
		id,
		data: new Abook({
			data: {
				header: {
					createdAt: Timestamp.fromMillis(
						options.createdAt ?? Date.UTC(2024, 0, 12, 8, 30),
					),
					metadata: {
						title,
						description,
						privateUserNote: "Sample note",
					},
					position: options.position
						? {
								entryId: "chapter-1",
								entryOffsetMillis: 120000,
								globalOffsetMillis: 120000,
							}
						: null,
				},
				entries,
			},
			aggregate: {
				totalDurationMillis: options.totalDurationMillis ?? 2_700_000,
				totalEntries: options.hasEntries !== false ? 1 : 0,
			},
		}),
	}
}

// Mock data sets
const singleAbookData: WithId<Abook>[] = [
	createMockAbook(
		"The Art of Async",
		"Deep dive into async programming patterns.",
		"abook-1",
		{ position: true },
	),
]

const multipleAbooksData: WithId<Abook>[] = [
	createMockAbook(
		"The Art of Async",
		"Deep dive into async programming patterns.",
		"abook-1",
		{ position: true },
	),
	createMockAbook(
		"Dungeon Design Journal",
		"Notes on crafting immersive tabletop adventures.",
		"abook-2",
		{
			createdAt: Date.UTC(2023, 10, 5, 19, 15),
			totalDurationMillis: 3_600_000,
		},
	),
	createMockAbook(
		"Coffee Roaster Stories",
		"Founder interviews from independent roasters.",
		"abook-3",
		{
			createdAt: Date.UTC(2022, 5, 22, 6),
			totalDurationMillis: -1,
			hasEntries: false,
		},
	),
]

const manyAbooksData: WithId<Abook>[] = [
	...multipleAbooksData,
	createMockAbook("Programming Fundamentals", "Learn the basics", "abook-4"),
	createMockAbook("Advanced React Patterns", "Master React", "abook-5"),
	createMockAbook(
		"System Design Interview",
		"Ace your interviews",
		"abook-6",
	),
	createMockAbook(
		"Machine Learning Basics",
		"Start your ML journey",
		"abook-7",
	),
	createMockAbook(
		"Microservices Architecture",
		"Build scalable systems",
		"abook-8",
	),
]

const emptyAbooksData: WithId<Abook>[] = []

// Create atoms for different scenarios
const singleAbookAtom = atom(Promise.resolve(singleAbookData))
const multipleAbooksAtom = atom(Promise.resolve(multipleAbooksData))
const manyAbooksAtom = atom(Promise.resolve(manyAbooksData))
const emptyAbooksAtom = atom(Promise.resolve(emptyAbooksData))
const loadingAbooksAtom = atom(
	new Promise<WithId<Abook>[]>((resolve) => {
		// Never resolves to simulate loading state
		setTimeout(() => resolve(multipleAbooksData), 10000)
	}),
)
const errorAbooksAtom = atom(
	Promise.reject(new Error("Failed to load audiobooks")),
)

const meta: Meta<typeof AbookList> = {
	title: "Components/Abook/List/AbookList",
	component: AbookList,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"Displays a list of audiobooks with loading, error, and empty states. Supports sorting and displays audiobook metadata. The component accepts an atom containing a promise of audiobooks with IDs.",
			},
		},
	},
	decorators: [
		(Story) => (
			<Container py="md">
				<Story />
			</Container>
		),
	],
	tags: ["autodocs"],
	argTypes: {
		abooksAtom: {
			control: false,
			description:
				"Atom containing a promise that resolves to an array of audiobooks with IDs",
		},
	},
}

export default meta
type Story = StoryObj<typeof AbookList>

export const Default: Story = {
	args: {
		abooksAtom: multipleAbooksAtom,
	},
}

export const SingleAbook: Story = {
	args: {
		abooksAtom: singleAbookAtom,
	},
	parameters: {
		docs: {
			description: {
				story: "Shows the list with a single audiobook entry.",
			},
		},
	},
}

export const ManyAbooks: Story = {
	args: {
		abooksAtom: manyAbooksAtom,
	},
	parameters: {
		docs: {
			description: {
				story: "Displays a longer list of audiobooks to demonstrate scrolling and layout with multiple items.",
			},
		},
	},
}

export const EmptyList: Story = {
	args: {
		abooksAtom: emptyAbooksAtom,
	},
	parameters: {
		docs: {
			description: {
				story: "Shows the component when no audiobooks are available. The list renders empty.",
			},
		},
	},
}

export const LoadingState: Story = {
	args: {
		abooksAtom: loadingAbooksAtom,
	},
	parameters: {
		docs: {
			description: {
				story: "Demonstrates the loading fallback while audiobooks are being fetched.",
			},
		},
	},
}

export const ErrorState: Story = {
	args: {
		abooksAtom: errorAbooksAtom,
	},
	parameters: {
		docs: {
			description: {
				story: "Shows how the component handles errors by throwing them to be caught by an error boundary.",
			},
		},
	},
}

export const MobileView: Story = {
	args: {
		abooksAtom: multipleAbooksAtom,
	},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
		docs: {
			description: {
				story: "Shows how the audiobook list appears on mobile devices.",
			},
		},
	},
}

export const TabletView: Story = {
	args: {
		abooksAtom: manyAbooksAtom,
	},
	parameters: {
		viewport: {
			defaultViewport: "tablet",
		},
		docs: {
			description: {
				story: "Demonstrates the list layout on tablet-sized screens.",
			},
		},
	},
}
