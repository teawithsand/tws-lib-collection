import type { Meta, StoryObj } from "@storybook/react"
import { AbookCreate } from "./AbookCreate"
import { AbookCreateData } from "./AbookCreateBehavior"

const meta = {
	title: "Components/Abook/AbookCreate",
	component: AbookCreate,
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
} satisfies Meta<typeof AbookCreate>

export default meta
type Story = StoryObj<typeof meta>

const handleSubmit = async (data: AbookCreateData) => {
	// Simulate async operation
	await new Promise((resolve) => setTimeout(resolve, 1500))

	// Simulate success
	alert(
		`Audiobook created!\n\nTitle: ${data.title}\nDescription: ${data.description || "(none)"}\nPrivate Note: ${data.privateNote || "(none)"}\nFiles: ${data.files.length}`,
	)
}

/**
 * Default form with no initial data
 */
export const Default: Story = {
	args: {
		onSubmit: handleSubmit,
	},
}

/**
 * Form pre-filled with initial data
 */
export const WithInitialData: Story = {
	args: {
		initialData: {
			title: "The Great Gatsby",
			description: "A classic American novel by F. Scott Fitzgerald",
			privateNote: "Read by narrator John Doe",
			files: [],
		},
		onSubmit: handleSubmit,
	},
}

/**
 * Empty form ready for user input
 */
export const EmptyForm: Story = {
	args: {
		onSubmit: handleSubmit,
	},
}
