import type { Meta, StoryObj } from "@storybook/react"
import {
	AbookEntryDisposition,
	AbookEntrySourceType,
} from "@teawithsand/booklibr"
import { Timestamp } from "@teawithsand/lngext"
import { fn } from "storybook/test"
import { AbookEntryEditModal } from "./AbookEntryEditModal"

const meta: Meta<typeof AbookEntryEditModal> = {
	title: "Components/Abook/Entry/Modal/AbookEntryEditModal",
	component: AbookEntryEditModal,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"A modal component for editing audiobook entries. Provides a modal wrapper around the edit form.",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		opened: {
			control: "boolean",
			description: "Whether the modal is open or closed",
		},
		entryData: {
			control: "object",
			description: "Entry data to edit",
		},
		onClose: {
			description: "Callback function called when modal is closed",
		},
		onSave: {
			description:
				"Callback function called when form is submitted successfully",
		},
	},
}

export default meta
type Story = StoryObj<typeof AbookEntryEditModal>

const sampleOriginalEntryData = {
	createdAt: Timestamp.fromDate(new Date()),
	name: "Sample Audio Entry",
	disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
	ordinalNumber: 1,
	source: {
		type: AbookEntrySourceType.UPLOAD as const,
		uploadedAt: Date.now(),
		uploadFileName: "sample-audio.mp3",
		uploadFileMime: "audio/mpeg",
	},
}

export const Open: Story = {
	args: {
		opened: true,
		entryData: sampleOriginalEntryData,
		onClose: fn(),
		onSave: fn(),
	},
}

export const Closed: Story = {
	args: {
		opened: false,
		entryData: sampleOriginalEntryData,
		onClose: fn(),
		onSave: fn(),
	},
}

export const EditingCoverImage: Story = {
	args: {
		opened: true,
		entryData: {
			...sampleOriginalEntryData,
			name: "Book Cover",
			disposition: AbookEntryDisposition.COVER_IMAGE,
			ordinalNumber: 0,
		},
		onClose: fn(),
		onSave: fn(),
	},
}
