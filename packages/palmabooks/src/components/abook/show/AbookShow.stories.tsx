import type { Meta, StoryObj } from "@storybook/react"
import { Abook } from "@teawithsand/booklibr"
import { Timestamp } from "@teawithsand/lngext"
import { Container } from "@teawithsand/mlui"
import { AbookShow } from "./AbookShow"

/**
 * Create a mock audiobook for testing
 */
const createMockAbook = (options: {
	title?: string
	description?: string
	privateUserNote?: string
	entryCount?: number
	durationMillis?: number
	createdAt?: number
	hasPosition?: boolean
}): Abook => {
	const {
		title = "The Hitchhiker's Guide to the Galaxy",
		description = "A humorous science fiction series following the misadventures of Arthur Dent.",
		privateUserNote = "",
		entryCount = 12,
		durationMillis = 6 * 60 * 60 * 1000, // 6 hours
		createdAt = Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
		hasPosition = false,
	} = options

	return new Abook({
		data: {
			header: {
				createdAt: Timestamp.fromNumber(createdAt),
				metadata: {
					title,
					description,
					privateUserNote,
				},
				position: hasPosition
					? {
							entryId: "entry-1",
							entryOffsetMillis: 5000,
							globalOffsetMillis: 12000,
						}
					: null,
			},
			entries: new Map(),
		},
		aggregate: {
			totalEntries: entryCount,
			totalDurationMillis: durationMillis,
		},
	})
}

const meta: Meta<typeof AbookShow> = {
	title: "Components/Abook/AbookShow",
	component: AbookShow,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"A mobile-first audiobook detail component that displays complete audiobook information including title, description, statistics, and private notes.",
			},
		},
	},
	decorators: [
		(Story) => (
			<Container size="xl" py="xl">
				<Story />
			</Container>
		),
	],
	tags: ["autodocs"],
	argTypes: {
		abook: {
			control: "object",
			description: "The audiobook data to display",
		},
	},
}

export default meta
type Story = StoryObj<typeof AbookShow>

export const Default: Story = {
	args: {
		abook: createMockAbook({}),
	},
}

export const WithoutDescription: Story = {
	args: {
		abook: createMockAbook({
			description: "",
		}),
	},
}

export const WithPrivateNote: Story = {
	args: {
		abook: createMockAbook({
			privateUserNote:
				"This is a personal favorite! The humor is timeless and Douglas Adams was a genius. Remember to listen to the restaurant scene again.",
		}),
	},
}

export const LongDescription: Story = {
	args: {
		abook: createMockAbook({
			description:
				"A humorous science fiction series following the misadventures of Arthur Dent, who is saved from Earth's destruction by his friend Ford Prefect, a researcher for the electronic travel guide 'The Hitchhiker's Guide to the Galaxy'. Together they travel through space encountering various alien species and bizarre situations. The series is known for its satirical take on modern life, its unique blend of philosophy and comedy, and memorable quotes like 'Don't Panic' and the answer to life, the universe, and everything being '42'. This sprawling adventure spans multiple books and explores themes of existence, bureaucracy, and the absurdity of the universe.",
		}),
	},
}

export const ShortDuration: Story = {
	args: {
		abook: createMockAbook({
			title: "Quick Listen",
			description: "A short audiobook perfect for a commute.",
			entryCount: 3,
			durationMillis: 45 * 60 * 1000, // 45 minutes
		}),
	},
}

export const LongDuration: Story = {
	args: {
		abook: createMockAbook({
			title: "Epic Fantasy Series",
			description: "A massive epic spanning multiple volumes.",
			entryCount: 87,
			durationMillis: 50 * 60 * 60 * 1000, // 50 hours
		}),
	},
}

export const InvalidDuration: Story = {
	args: {
		abook: createMockAbook({
			durationMillis: -1,
		}),
	},
}

export const MinimalData: Story = {
	args: {
		abook: createMockAbook({
			title: "",
			description: "",
			privateUserNote: "",
			entryCount: 0,
			durationMillis: 0,
		}),
	},
}

export const WithPosition: Story = {
	args: {
		abook: createMockAbook({
			hasPosition: true,
		}),
	},
}

export const LongTitle: Story = {
	args: {
		abook: createMockAbook({
			title: "The Extremely Long and Unnecessarily Verbose Title of This Audiobook That Just Keeps Going On and On Without Any Real Purpose Except to Test How the Component Handles Really Long Titles",
			description: "Testing title wrapping behavior.",
		}),
	},
}

export const WithoutBackButton: Story = {
	args: {
		abook: createMockAbook({}),
	},
}

export const FullyPopulated: Story = {
	args: {
		abook: createMockAbook({
			title: "The Complete Collection",
			description:
				"A fully populated audiobook with all possible fields filled in, including a lengthy description that spans multiple lines.",
			privateUserNote:
				"This is my favorite audiobook series! I've listened to it three times already. The narrator does an amazing job with the character voices.",
			entryCount: 24,
			durationMillis: 15 * 60 * 60 * 1000, // 15 hours
			hasPosition: true,
		}),
	},
}
