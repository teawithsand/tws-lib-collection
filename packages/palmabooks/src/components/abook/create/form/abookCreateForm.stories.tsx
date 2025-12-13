import type { Meta, StoryObj } from "@storybook/react"
import { AbookCreateForm } from "./abookCreateForm"
import { AbookCreateFormData } from "./abookCreateFormClass"

const meta = {
	title: "Components/Abook/AbookCreateForm",
	component: AbookCreateForm,
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
} satisfies Meta<typeof AbookCreateForm>

export default meta
type Story = StoryObj<typeof meta>

const defaultOnSubmit = async (data: AbookCreateFormData) => {
	// Simulate async operation
	await new Promise((resolve) => setTimeout(resolve, 1000))

	alert(
		`Audiobook created!\n\nTitle: ${data.title}\nDescription: ${data.description}\nPrivate Note: ${data.privateNote}\nFiles: ${data.files.length}`,
	)
}

export const Default: Story = {
	args: {
		onSubmit: defaultOnSubmit,
	},
}

export const WithInitialData: Story = {
	args: {
		initialData: {
			title: "The Great Gatsby",
			description: "A classic American novel by F. Scott Fitzgerald",
			privateNote: "Read by narrator John Doe",
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
			files: [],
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
				"Personal notes about this audiobook. Remember to listen to chapters 3 and 7 again. Great performance by the narrator. Would recommend to friends who enjoy this genre.",
		},
		onSubmit: defaultOnSubmit,
	},
}

export const WithError: Story = {
	args: {
		onSubmit: async () => {
			await new Promise((resolve) => setTimeout(resolve, 500))
			throw new Error("Failed to create audiobook. Please try again.")
		},
	},
}

export const QuickSubmit: Story = {
	args: {
		onSubmit: async (data: AbookCreateFormData) => {
			// Very quick submission
			await new Promise((resolve) => setTimeout(resolve, 100))
			// eslint-disable-next-line no-console
			console.log("Submitted:", data)
		},
	},
}
