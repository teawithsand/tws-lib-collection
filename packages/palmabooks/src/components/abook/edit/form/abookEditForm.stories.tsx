import type { Meta, StoryObj } from "@storybook/react"
import { AbookEditForm } from "./abookEditForm"
import { AbookEditFormData } from "./abookEditFormClass"

const meta = {
	title: "Components/Abook/AbookEditForm",
	component: AbookEditForm,
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
} satisfies Meta<typeof AbookEditForm>

export default meta
type Story = StoryObj<typeof meta>

const defaultOnSubmit = async (data: AbookEditFormData) => {
	// Simulate async operation
	await new Promise((resolve) => setTimeout(resolve, 1000))

	alert(
		`Audiobook updated!\n\nTitle: ${data.title}\nDescription: ${data.description}\nPrivate Note: ${data.privateNote}`,
	)
}

export const Default: Story = {
	args: {
		initialData: {
			title: "The Great Gatsby",
			description: "A classic American novel by F. Scott Fitzgerald",
			privateNote: "Read by narrator John Doe",
		},
		onSubmit: defaultOnSubmit,
	},
}

export const MinimalData: Story = {
	args: {
		initialData: {
			title: "Short Title",
			description: "",
			privateNote: "",
		},
		onSubmit: defaultOnSubmit,
	},
}

export const EmptyForm: Story = {
	args: {
		initialData: {
			title: "",
			description: "",
			privateNote: "",
		},
		onSubmit: defaultOnSubmit,
	},
}

export const LongContent: Story = {
	args: {
		initialData: {
			title: "A Very Long Audiobook Title That Might Span Multiple Lines",
			description:
				"This is a very long description that contains a lot of text. It goes on and on, describing the audiobook in great detail. The story is about adventure, romance, and intrigue. It has many twists and turns that will keep you on the edge of your seat. The narrator does an excellent job of bringing the characters to life with distinct voices and emotional depth.",
			privateNote:
				"Personal notes about this audiobook. Remember to listen to chapters 3 and 7 again. Great performance by the narrator. Would recommend to friends who enjoy this genre. This is a particularly long note that contains many observations and thoughts about the audiobook experience.",
		},
		onSubmit: defaultOnSubmit,
	},
}

export const WithError: Story = {
	args: {
		initialData: {
			title: "Test Audiobook",
			description: "Testing error handling",
			privateNote: "Some notes",
		},
		onSubmit: async () => {
			await new Promise((resolve) => setTimeout(resolve, 500))
			throw new Error("Failed to update audiobook. Please try again.")
		},
	},
}

export const QuickSubmit: Story = {
	args: {
		initialData: {
			title: "Quick Edit",
			description: "Quick description",
			privateNote: "Quick note",
		},
		onSubmit: async (data: AbookEditFormData) => {
			// Very quick submission
			await new Promise((resolve) => setTimeout(resolve, 100))
			// eslint-disable-next-line no-console
			console.log("Submitted:", data)
		},
	},
}
