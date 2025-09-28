import type { Meta, StoryObj } from "@storybook/react"
import {
	AbookEntry,
	AbookEntryDisposition,
	AbookEntrySourceType,
} from "@teawithsand/booklibr"
import { atom } from "@teawithsand/fstate"
import { Timestamp } from "@teawithsand/lngext"
import { AbookEntryListBehavior } from "../behavior/AbookEntryListBehavior"
import { AbookEntryCard } from "./AbookEntryCard"

const meta: Meta<typeof AbookEntryCard> = {
	title: "Components/Abook/NewEntryList/AbookEntryCard",
	component: AbookEntryCard,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component:
					"Enhanced AbookEntryCard component with integrated edit modal functionality. Includes Edit button that opens a modal for editing entry data locally before saving to the list.",
			},
		},
	},
	decorators: [
		(Story) => (
			<div style={{ maxWidth: "600px" }}>
				<Story />
			</div>
		),
	],
	tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof AbookEntryCard>

const createMockBehavior = () => {
	// Create an atom with empty entries for demo purposes
	const entriesAtom = atom(Promise.resolve([]))
	return new AbookEntryListBehavior(entriesAtom)
}

const createMockAudioEntry = () => ({
	id: "audio-entry-1",
	data: new AbookEntry({
		data: {
			createdAt: Timestamp.fromDate(new Date()),
			name: "Chapter 1: Introduction",
			disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
			ordinalNumber: 1,
			source: {
				type: AbookEntrySourceType.UPLOAD as const,
				uploadedAt: Date.now(),
				uploadFileName: "chapter-01-introduction.mp3",
				uploadFileMime: "audio/mpeg",
			},
		},
		aggregate: {
			metadata: null,
			blobSize: null,
		},
	}),
})

const createMockCoverEntry = () => ({
	id: "cover-entry-1",
	data: new AbookEntry({
		data: {
			createdAt: Timestamp.fromDate(new Date()),
			name: "Book Cover",
			disposition: AbookEntryDisposition.COVER_IMAGE,
			ordinalNumber: 0,
			source: {
				type: AbookEntrySourceType.UPLOAD as const,
				uploadedAt: Date.now(),
				uploadFileName: "book-cover.jpg",
				uploadFileMime: "image/jpeg",
			},
		},
		aggregate: {
			metadata: null,
			blobSize: null,
		},
	}),
})

export const AudioEntryWithEditButton: Story = {
	args: {
		entry: createMockAudioEntry(),
		behavior: createMockBehavior(),
		abookId: "sample-audiobook",
		showMetadata: true,
	},
}

export const CoverImageEntryWithEditButton: Story = {
	args: {
		entry: createMockCoverEntry(),
		behavior: createMockBehavior(),
		abookId: "sample-audiobook",
		showMetadata: true,
	},
}

export const EntryWithoutMetadata: Story = {
	args: {
		entry: createMockAudioEntry(),
		behavior: createMockBehavior(),
		abookId: "sample-audiobook",
		showMetadata: false,
	},
}
