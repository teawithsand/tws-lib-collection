import type { Meta, StoryObj } from "@storybook/react"
import { Abook, WithId } from "@teawithsand/booklibr"
import { Timestamp } from "@teawithsand/lngext"
import { Container } from "@teawithsand/mlui"
import { AbookList } from "./AbookList"

/**
 * Create a mock audiobook for testing
 */
const createMockAbook = (
	id: number,
	title: string,
	description: string,
	options: {
		entryCount?: number
		durationMillis?: number
		privateNote?: string
	} = {},
): WithId<Abook> => {
	const { entryCount = 0, durationMillis = 0, privateNote = "" } = options

	return {
		id,
		data: new Abook({
			data: {
				header: {
					createdAt: Timestamp.fromNumber(Date.now()),
					metadata: {
						title,
						description,
						privateUserNote: privateNote,
					},
					position: null,
				},
				entries: new Map(),
			},
			aggregate: {
				totalEntries: entryCount,
				totalDurationMillis: durationMillis,
			},
		}),
	}
}

const meta: Meta<typeof AbookList> = {
	title: "Components/Abook/AbookList",
	component: AbookList,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"A mobile-first audiobook list component that displays audiobooks in a simple vertical list. Shows title, description, entry count, duration, and private notes for each audiobook.",
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
		abooks: {
			control: "object",
			description: "Array of audiobooks to display",
		},
		onCreateAbookClick: {
			action: "createAbookClicked",
			description: "Callback when create audiobook button is clicked",
		},
		onRefresh: {
			action: "refreshClicked",
			description: "Callback when refresh button is clicked",
		},
	},
}

export default meta
type Story = StoryObj<typeof AbookList>

export const Empty: Story = {
	args: {
		abooks: [],
	},
}

export const SingleAudiobook: Story = {
	args: {
		abooks: [
			createMockAbook(
				1,
				"The Hitchhiker's Guide to the Galaxy",
				"A humorous science fiction series following the misadventures of Arthur Dent.",
				{
					entryCount: 12,
					durationMillis: 6 * 60 * 60 * 1000, // 6 hours
				},
			),
		],
	},
}

export const MultipleAudiobooks: Story = {
	args: {
		abooks: [
			createMockAbook(
				1,
				"The Hitchhiker's Guide to the Galaxy",
				"A humorous science fiction series following the misadventures of Arthur Dent.",
				{
					entryCount: 12,
					durationMillis: 6 * 60 * 60 * 1000, // 6 hours
				},
			),
			createMockAbook(
				2,
				"1984",
				"A dystopian novel set in a totalitarian society under constant surveillance.",
				{
					entryCount: 24,
					durationMillis: 11 * 60 * 60 * 1000, // 11 hours
					privateNote: "Great book, must re-listen",
				},
			),
			createMockAbook(
				3,
				"To Kill a Mockingbird",
				"A novel about racial injustice and childhood innocence in the American South.",
				{
					entryCount: 18,
					durationMillis: 12 * 60 * 60 * 1000 + 30 * 60 * 1000, // 12.5 hours
				},
			),
		],
	},
}

export const LongList: Story = {
	args: {
		abooks: [
			createMockAbook(
				1,
				"The Lord of the Rings: The Fellowship of the Ring",
				"The first part of Tolkien's epic fantasy trilogy about a hobbit's quest to destroy a powerful ring.",
				{
					entryCount: 45,
					durationMillis: 19 * 60 * 60 * 1000, // 19 hours
				},
			),
			createMockAbook(
				2,
				"Harry Potter and the Philosopher's Stone",
				"A young wizard discovers his magical heritage and attends Hogwarts School.",
				{
					entryCount: 17,
					durationMillis: 8 * 60 * 60 * 1000 + 15 * 60 * 1000, // 8.25 hours
					privateNote: "Read this every year!",
				},
			),
			createMockAbook(
				3,
				"Dune",
				"A science fiction epic about politics, religion, and ecology on a desert planet.",
				{
					entryCount: 62,
					durationMillis: 21 * 60 * 60 * 1000, // 21 hours
				},
			),
			createMockAbook(
				4,
				"The Hobbit",
				"Bilbo Baggins' adventure with dwarves to reclaim their mountain home from a dragon.",
				{
					entryCount: 28,
					durationMillis: 11 * 60 * 60 * 1000, // 11 hours
				},
			),
			createMockAbook(
				5,
				"Pride and Prejudice",
				"A romantic novel about Elizabeth Bennet and Mr. Darcy in Georgian England.",
				{
					entryCount: 22,
					durationMillis: 11 * 60 * 60 * 1000 + 45 * 60 * 1000, // 11.75 hours
					privateNote: "Beautiful narration",
				},
			),
			createMockAbook(
				6,
				"The Great Gatsby",
				"A tragic story of wealth, love, and the American Dream in the 1920s.",
				{
					entryCount: 9,
					durationMillis: 4 * 60 * 60 * 1000 + 50 * 60 * 1000, // 4.83 hours
				},
			),
		],
	},
}

export const WithoutDescriptions: Story = {
	args: {
		abooks: [
			createMockAbook(1, "Book One", "", {
				entryCount: 5,
				durationMillis: 2 * 60 * 60 * 1000, // 2 hours
			}),
			createMockAbook(2, "Book Two", "", {
				entryCount: 8,
				durationMillis: 3 * 60 * 60 * 1000 + 30 * 60 * 1000, // 3.5 hours
			}),
			createMockAbook(3, "Book Three", "", {
				entryCount: 12,
				durationMillis: 6 * 60 * 60 * 1000, // 6 hours
			}),
		],
	},
}

export const ShortDurations: Story = {
	args: {
		abooks: [
			createMockAbook(
				1,
				"Short Story Collection",
				"A collection of brief tales and narratives.",
				{
					entryCount: 3,
					durationMillis: 45 * 60 * 1000, // 45 minutes
				},
			),
			createMockAbook(
				2,
				"Quick Listen",
				"Perfect for a short commute or break.",
				{
					entryCount: 1,
					durationMillis: 15 * 60 * 1000, // 15 minutes
				},
			),
		],
	},
}

export const InvalidDuration: Story = {
	args: {
		abooks: [
			createMockAbook(
				1,
				"Book with Loading Error",
				"This audiobook has an invalid duration value.",
				{
					entryCount: 5,
					durationMillis: -1, // Invalid duration
				},
			),
			createMockAbook(
				2,
				"Normal Audiobook",
				"This one has a valid duration for comparison.",
				{
					entryCount: 10,
					durationMillis: 5 * 60 * 60 * 1000, // 5 hours
				},
			),
		],
	},
}

export const LongTitles: Story = {
	args: {
		abooks: [
			createMockAbook(
				1,
				"The Extremely Long and Detailed Title of This Audiobook That Goes On and On",
				"This audiobook has a very long title that should be truncated properly in the card display.",
				{
					entryCount: 15,
					durationMillis: 8 * 60 * 60 * 1000, // 8 hours
				},
			),
			createMockAbook(
				2,
				"Another Incredibly Verbose Title That Tests the Line Clamping Functionality",
				"Testing how the component handles long titles and descriptions together.",
				{
					entryCount: 20,
					durationMillis: 12 * 60 * 60 * 1000, // 12 hours
					privateNote:
						"This note is also quite long to test truncation behavior",
				},
			),
		],
	},
}
