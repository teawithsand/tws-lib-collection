import type { Meta, StoryObj } from "@storybook/react"
import { Container } from "@teawithsand/mlui"
import { fn } from "storybook/test"
import { AbookEdit } from "./AbookEdit"

const createMockAbook = (
	title = "The Great Gatsby",
	description = "A classic American novel by F. Scott Fitzgerald",
	privateUserNote = "One of my favorite classics",
) => ({
	data: {
		header: {
			metadata: {
				title,
				description,
				privateUserNote,
			},
		},
	},
})

const meta: Meta<typeof AbookEdit> = {
	title: "Components/Abook/Edit/AbookEdit",
	component: AbookEdit,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"A non-autonomous component for editing existing audiobooks. Takes abook data and callbacks as props, making it suitable for Storybook and testing.",
			},
		},
	},
	decorators: [
		(Story) => (
			<Container>
				<div style={{ padding: "1rem" }}>
					<Story />
				</div>
			</Container>
		),
	],
	tags: ["autodocs"],
	argTypes: {
		abook: {
			control: "object",
			description: "The audiobook data to edit",
		},
		onSubmit: {
			description:
				"Callback function called when form is submitted successfully",
		},
		error: {
			control: "text",
			description: "Error message to display at the top of the form",
		},
	},
}

export default meta
type Story = StoryObj<typeof AbookEdit>

export const Default: Story = {
	args: {
		abook: createMockAbook(),
		onSubmit: fn(),
		error: null,
	},
}

export const WithLongContent: Story = {
	args: {
		abook: createMockAbook(
			"A Very Long Title That Might Wrap to Multiple Lines in the Form",
			"This is a very long description that contains multiple sentences and provides detailed information about the audiobook. It includes plot summaries, character descriptions, and perhaps some background information about the author and the historical context in which the book was written. This helps test how the form handles longer content and ensures proper text wrapping and field sizing.",
			"This is a lengthy private note that the user might have written about this audiobook. It could contain personal thoughts, reading progress, favorite quotes, or reminders about specific chapters or sections. Testing with longer content ensures the form remains usable and visually appealing even with substantial amounts of text.",
		),
		onSubmit: fn(),
		error: null,
	},
}

export const WithMinimalContent: Story = {
	args: {
		abook: createMockAbook("Book", "", ""),
		onSubmit: fn(),
		error: null,
	},
}

export const WithError: Story = {
	args: {
		abook: createMockAbook(),
		onSubmit: fn(),
		error: "Failed to update audiobook. Please check your connection and try again.",
	},
}

export const WithLongError: Story = {
	args: {
		abook: createMockAbook(),
		onSubmit: fn(),
		error: "A detailed error message that explains exactly what went wrong during the update process. This might include technical details, suggestions for resolution, or contact information for support. Testing with longer error messages ensures proper display and accessibility.",
	},
}

export const NotFound: Story = {
	args: {
		abook: null,
		onSubmit: fn(),
		error: null,
	},
}

export const InteractiveExample: Story = {
	args: {
		abook: createMockAbook(),
		onSubmit: async () => {
			// Simulate async operation
			await new Promise((resolve) => setTimeout(resolve, 1000))

			// Simulate occasional errors for testing
			if (Math.random() < 0.3) {
				throw new Error("Simulated network error")
			}
		},
		error: null,
	},
}
