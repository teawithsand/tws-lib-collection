import type { Meta, StoryObj } from "@storybook/react"
import {
	Abook,
	AbookEntry,
	AbookEntryDisposition,
	AbookEntrySourceType,
	WithId,
} from "@teawithsand/booklibr"
import { Timestamp } from "@teawithsand/lngext"
import { Container } from "@teawithsand/mlui"
import { AbookShow } from "./AbookShow"

// Mock data helper
const createMockAbook = (
	title: string,
	description: string,
	id: string,
	options: {
		totalDurationMillis?: number
		totalEntries?: number
		createdAt?: number
		position?: boolean
		positionOffset?: number
	} = {},
): WithId<Abook> => {
	const entries = new Map()

	// Create some mock entries
	for (let i = 1; i <= (options.totalEntries || 5); i++) {
		entries.set(
			`chapter-${i}`,
			new AbookEntry({
				data: {
					createdAt: Timestamp.fromMillis(Date.UTC(2024, 0, 10, 15)),
					name: `Chapter ${i}`,
					disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
					ordinalNumber: i,
					source: {
						type: AbookEntrySourceType.UPLOAD,
						uploadedAt: Timestamp.fromMillis(
							Date.UTC(2024, 0, 11, 9, 45),
						),
						uploadFileName: `chapter-${i}.mp3`,
						uploadFileMime: "audio/mpeg",
					},
				},
				aggregate: {
					metadata: null,
					blobSize: 1024 * 1024 * 10, // 10MB
				},
			}),
		)
	}

	const totalDuration = options.totalDurationMillis || entries.size * 1800000
	const position = options.position
		? {
				entryId: "chapter-1",
				entryOffsetMillis: 300000, // 5 minutes into first chapter
				globalOffsetMillis:
					options.positionOffset || totalDuration * 0.3, // 30% progress
			}
		: null

	return {
		id,
		data: new Abook({
			data: {
				header: {
					createdAt: Timestamp.fromMillis(
						options.createdAt || Date.UTC(2024, 0, 1, 12),
					),
					metadata: {
						title,
						description,
						privateUserNote:
							"This is my personal note about this audiobook.",
					},
					position,
				},
				entries,
			},
			aggregate: {
				totalDurationMillis: totalDuration,
				totalEntries: entries.size,
			},
		}),
	}
}

// Mock data sets
const defaultAbook = createMockAbook(
	"The Art of Programming",
	"A comprehensive guide to software development best practices and design patterns.",
	"abook-1",
	{ position: true },
)

const longAbook = createMockAbook(
	"A Very Long Audiobook Title That Might Wrap to Multiple Lines",
	"This is a longer description that demonstrates how the component handles extensive metadata. It includes multiple sentences and detailed information about the content, author background, and what listeners can expect to learn from this comprehensive audiobook series.",
	"abook-2",
	{
		totalEntries: 24,
		totalDurationMillis: 43200000, // 12 hours
		position: true,
		positionOffset: 21600000, // 6 hours (50% progress)
	},
)

const shortAbook = createMockAbook(
	"Quick Read",
	"Short audiobook.",
	"abook-3",
	{
		totalEntries: 2,
		totalDurationMillis: 1800000, // 30 minutes
		position: false,
	},
)

const noProgressAbook = createMockAbook(
	"Unstarted Book",
	"An audiobook that hasn't been started yet.",
	"abook-4",
	{ position: false },
)

const meta: Meta<typeof AbookShow> = {
	title: "Components/Abook/Show/AbookShow",
	component: AbookShow,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"Displays detailed information about an audiobook including metadata, statistics, and action buttons. Shows duration, entry count, progress with visual progress bar, and provides clickable action cards for common operations.",
			},
		},
	},
	decorators: [
		(Story) => (
			<Container py="md" size="md">
				<Story />
			</Container>
		),
	],
	tags: ["autodocs"],
	argTypes: {
		abook: {
			control: false,
			description: "The audiobook data to display",
		},
	},
}

export default meta
type Story = StoryObj<typeof AbookShow>

export const Default: Story = {
	args: {
		abook: defaultAbook,
	},
}

export const LongContent: Story = {
	args: {
		abook: longAbook,
	},
	parameters: {
		docs: {
			description: {
				story: "Shows how the component handles longer titles, descriptions, and more entries.",
			},
		},
	},
}

export const ShortContent: Story = {
	args: {
		abook: shortAbook,
	},
	parameters: {
		docs: {
			description: {
				story: "Shows the component with minimal content - short title, description, and few entries.",
			},
		},
	},
}

export const NoProgress: Story = {
	args: {
		abook: noProgressAbook,
	},
	parameters: {
		docs: {
			description: {
				story: "Shows how the component displays audiobooks that haven't been started yet.",
			},
		},
	},
}

export const WithCallbacks: Story = {
	args: {
		abook: defaultAbook,
	},
	parameters: {
		docs: {
			description: {
				story: "Shows the component with action callbacks enabled. Click the action cards to see console output.",
			},
		},
	},
	render: (args) => (
		<AbookShow
			{...args}
			onDelete={() => {}}
			onEdit={() => {}}
			onPreview={() => {}}
			onAddFiles={() => {}}
		/>
	),
}

export const MobileView: Story = {
	args: {
		abook: defaultAbook,
	},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
		docs: {
			description: {
				story: "Shows how the audiobook details appear on mobile devices with responsive grid layout.",
			},
		},
	},
}

export const TabletView: Story = {
	args: {
		abook: longAbook,
	},
	parameters: {
		viewport: {
			defaultViewport: "tablet",
		},
		docs: {
			description: {
				story: "Shows the component optimized for tablet viewing.",
			},
		},
	},
}
