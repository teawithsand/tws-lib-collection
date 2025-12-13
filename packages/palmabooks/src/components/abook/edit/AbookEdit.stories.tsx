import type { Meta, StoryObj } from "@storybook/react"
import { Abook, AbookEntry } from "@teawithsand/booklibr"
import { Timestamp } from "@teawithsand/lngext"
import { AbookEdit, AbookEditData } from "./AbookEdit"

const createMockAbook = (
	title: string,
	description: string,
	privateNote: string,
): Abook => {
	return new Abook({
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
			entries: new Map<string, AbookEntry>(),
		},
		aggregate: {
			totalDurationMillis: 0,
			totalEntries: 0,
		},
	})
}

const meta = {
	title: "Components/Abook/AbookEdit",
	component: AbookEdit,
	parameters: {
		layout: "padded",
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<div style={{ maxWidth: "700px", margin: "0 auto" }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof AbookEdit>

export default meta
type Story = StoryObj<typeof meta>

const handleSubmit = async (data: AbookEditData) => {
	// Simulate async operation
	await new Promise((resolve) => setTimeout(resolve, 1500))

	// Simulate success
	alert(
		`Audiobook updated!\n\nTitle: ${data.title}\nDescription: ${data.description || "(none)"}\nPrivate Note: ${data.privateNote || "(none)"}`,
	)
}

/**
 * Default form with typical audiobook data
 */
export const Default: Story = {
	args: {
		abook: {
			id: "1",
			data: createMockAbook(
				"The Great Gatsby",
				"A classic American novel by F. Scott Fitzgerald",
				"Read by narrator John Doe",
			),
		},
		onSubmit: handleSubmit,
	},
}

/**
 * Form with minimal data (only title)
 */
export const MinimalData: Story = {
	args: {
		abook: {
			id: "2",
			data: createMockAbook("Short Title", "", ""),
		},
		onSubmit: handleSubmit,
	},
}

/**
 * Form with long content in all fields
 */
export const LongContent: Story = {
	args: {
		abook: {
			id: "3",
			data: createMockAbook(
				"A Very Long Audiobook Title That Might Span Multiple Lines When Displayed in the Form",
				"This is a very long description that contains a lot of text. It goes on and on, describing the audiobook in great detail. The story is about adventure, romance, and intrigue. It has many twists and turns that will keep you on the edge of your seat. The narrator does an excellent job of bringing the characters to life with distinct voices and emotional depth. This audiobook is a must-listen for fans of the genre.",
				"Personal notes about this audiobook. Remember to listen to chapters 3 and 7 again. Great performance by the narrator. Would recommend to friends who enjoy this genre. This is a particularly long note that contains many observations and thoughts about the audiobook experience. I've been listening to this over several weeks and really appreciate the production quality.",
			),
		},
		onSubmit: handleSubmit,
	},
}

/**
 * Form that simulates a submission error
 */
export const WithError: Story = {
	args: {
		abook: {
			id: "4",
			data: createMockAbook(
				"Test Audiobook",
				"Testing error handling",
				"Some notes",
			),
		},
		onSubmit: async () => {
			await new Promise((resolve) => setTimeout(resolve, 500))
			throw new Error("Failed to update audiobook. Please try again.")
		},
	},
}

/**
 * Form with empty optional fields
 */
export const EmptyOptionalFields: Story = {
	args: {
		abook: {
			id: "5",
			data: createMockAbook("My Audiobook", "", ""),
		},
		onSubmit: handleSubmit,
	},
}

/**
 * Quick submit for testing fast interactions
 */
export const QuickSubmit: Story = {
	args: {
		abook: {
			id: "6",
			data: createMockAbook(
				"Quick Edit Test",
				"Quick description",
				"Quick note",
			),
		},
		onSubmit: async (data: AbookEditData) => {
			await new Promise((resolve) => setTimeout(resolve, 100))
			// eslint-disable-next-line no-console
			console.log("Submitted:", data)
		},
	},
}
