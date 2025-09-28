import type { Meta, StoryObj } from "@storybook/react"
import {
	AbookEntryDisposition,
	AbookEntrySourceType,
} from "@teawithsand/booklibr"
import { Timestamp } from "@teawithsand/lngext"
import { fn } from "storybook/test"
import { AbookEntryEditForm } from "./abookEntryEditForm"

const meta: Meta<typeof AbookEntryEditForm> = {
	title: "Components/Abook/Entry/Form/AbookEntryEditForm",
	component: AbookEntryEditForm,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"A form component for editing audiobook entries. Includes validation for name, disposition, and ordinal number.",
			},
		},
	},
	decorators: [
		(Story) => (
			<div style={{ padding: "1rem" }}>
				<Story />
			</div>
		),
	],
	tags: ["autodocs"],
	argTypes: {
		initialData: {
			control: "object",
			description: "Initial form data to populate the fields",
		},
		onSubmit: {
			description:
				"Callback function called when form is submitted successfully",
		},
		onCancel: {
			description:
				"Callback function called when cancel button is clicked",
		},
		error: {
			control: "text",
			description:
				"External error message to display at the top of the form",
		},
	},
}

export default meta
type Story = StoryObj<typeof AbookEntryEditForm>

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

export const Default: Story = {
	args: {
		initialData: {
			name: "Sample Audio Entry",
			disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
			ordinalNumber: 1,
		},
		originalEntryData: sampleOriginalEntryData,
		onSubmit: fn(),
		onCancel: fn(),
	},
}

export const WithCoverImage: Story = {
	args: {
		initialData: {
			name: "Book Cover",
			disposition: AbookEntryDisposition.COVER_IMAGE,
			ordinalNumber: 0,
		},
		originalEntryData: {
			...sampleOriginalEntryData,
			name: "Book Cover",
			disposition: AbookEntryDisposition.COVER_IMAGE,
			ordinalNumber: 0,
		},
		onSubmit: fn(),
		onCancel: fn(),
	},
}

export const WithDescription: Story = {
	args: {
		initialData: {
			name: "Book Description",
			disposition: AbookEntryDisposition.DESCRIPTION,
			ordinalNumber: 0,
		},
		originalEntryData: {
			...sampleOriginalEntryData,
			name: "Book Description",
			disposition: AbookEntryDisposition.DESCRIPTION,
			ordinalNumber: 0,
		},
		onSubmit: fn(),
		onCancel: fn(),
	},
}

export const WithError: Story = {
	args: {
		initialData: {
			name: "Sample Entry",
			disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
			ordinalNumber: 1,
		},
		originalEntryData: sampleOriginalEntryData,
		onSubmit: fn(() => {
			throw new Error("Failed to update entry")
		}),
		onCancel: fn(),
		error: "Failed to update the entry. Please try again.",
	},
}
