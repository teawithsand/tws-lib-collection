import type { Meta, StoryObj } from "@storybook/react"
import {
	AbookEntry,
	AbookEntryDisposition,
	AbookEntrySourceType,
	WithId,
} from "@teawithsand/booklibr"
import { atom } from "@teawithsand/fstate"
import { Timestamp } from "@teawithsand/lngext"
import { AbookEntryList } from "./AbookEntryList"
import { AbookEntryListBehavior } from "./behavior/AbookEntryListBehavior"

// Mock entries for the story
const mockEntries: WithId<AbookEntry>[] = [
	{
		id: "1",
		data: new AbookEntry({
			data: {
				createdAt: Timestamp.fromDate(new Date()),
				name: "Chapter 01",
				disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
				ordinalNumber: 0,
				source: {
					type: AbookEntrySourceType.UPLOAD,
					uploadedAt: Date.now(),
					uploadFileName: "chapter-01.mp3",
					uploadFileMime: "audio/mpeg",
				},
			},
			aggregate: {
				metadata: null,
				blobSize: null,
			},
		}),
	},
	{
		id: "2",
		data: new AbookEntry({
			data: {
				createdAt: Timestamp.fromDate(new Date()),
				name: "Chapter 02",
				disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
				ordinalNumber: 0,
				source: {
					type: AbookEntrySourceType.UPLOAD,
					uploadedAt: Date.now(),
					uploadFileName: "chapter-02.mp3",
					uploadFileMime: "audio/mpeg",
				},
			},
			aggregate: {
				metadata: null,
				blobSize: null,
			},
		}),
	},
	{
		id: "3",
		data: new AbookEntry({
			data: {
				createdAt: Timestamp.fromDate(new Date()),
				name: "Cover Image",
				disposition: AbookEntryDisposition.COVER_IMAGE,
				ordinalNumber: 0,
				source: {
					type: AbookEntrySourceType.UPLOAD,
					uploadedAt: Date.now(),
					uploadFileName: "cover.jpg",
					uploadFileMime: "image/jpeg",
				},
			},
			aggregate: {
				metadata: null,
				blobSize: null,
			},
		}),
	},
]

const meta: Meta<typeof AbookEntryList> = {
	title: "Components/Abook/NewEntryList/AbookEntryList",
	component: AbookEntryList,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component:
					"An entry list component that uses AbookEntryListBehavior for state management.",
			},
		},
	},
	tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof meta>

// Create a behavior instance for the stories
const createBehavior = (entries: WithId<AbookEntry>[]) => {
	const entriesAtom = atom(Promise.resolve(entries))
	return new AbookEntryListBehavior(entriesAtom)
}

export const Default: Story = {
	args: {
		behavior: createBehavior(mockEntries),
	},
	parameters: {
		docs: {
			description: {
				story: "Default simple entry list with mock data including audio chapters and metadata files.",
			},
		},
	},
}

export const Empty: Story = {
	args: {
		behavior: createBehavior([]),
	},
	parameters: {
		docs: {
			description: {
				story: "Empty state when no entries are available.",
			},
		},
	},
}

export const SingleEntry: Story = {
	args: {
		behavior: createBehavior([mockEntries[0]]),
	},
	parameters: {
		docs: {
			description: {
				story: "Single entry display.",
			},
		},
	},
}
