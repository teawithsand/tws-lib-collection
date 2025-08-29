import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "storybook/test"
import { AbookCreateForm } from "./abookCreateForm"

const meta: Meta<typeof AbookCreateForm> = {
	title: "Components/Abook/Form/AbookCreateForm",
	component: AbookCreateForm,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"A form component for creating new audiobooks. Includes validation for title, description, and private notes.",
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
		error: {
			control: "text",
			description:
				"External error message to display at the top of the form",
		},
	},
}

export default meta
type Story = StoryObj<typeof AbookCreateForm>

export const Default: Story = {
	args: {
		onSubmit: fn(),
	},
}

export const WithInitialData: Story = {
	args: {
		initialData: {
			title: "Sample Book Title",
			description: "This is a sample description for the audiobook.",
			privateUserNote: "Personal notes about this book",
		},
		onSubmit: fn(),
	},
}

export const WithPartialData: Story = {
	args: {
		initialData: {
			title: "The Great Gatsby",
		},
		onSubmit: fn(),
	},
}

export const WithAsyncSubmission: Story = {
	args: {
		onSubmit: fn(() => {
			return new Promise<void>((resolve) => {
				setTimeout(resolve, 2000)
			})
		}),
	},
}

export const WithSubmissionError: Story = {
	args: {
		onSubmit: fn(() => {
			return new Promise<void>((_, reject) => {
				setTimeout(() => {
					reject(new Error("Failed to create audiobook"))
				}, 1000)
			})
		}),
	},
}

export const WithLongContent: Story = {
	args: {
		initialData: {
			title: "A".repeat(250),
			description: "B".repeat(2100),
			privateUserNote: "C".repeat(1100),
		},
		onSubmit: fn(),
	},
}

export const WithEmptyTitle: Story = {
	args: {
		initialData: {
			title: "",
			description: "This book has no title set",
			privateUserNote: "Need to add a title",
		},
		onSubmit: fn(),
	},
}

export const LongSubmit: Story = {
	args: {
		initialData: {
			title: "Test Audiobook",
			description: "This is a test submission that takes 3 seconds",
			privateUserNote: "Testing long submit",
		},
		onSubmit: () => new Promise((resolve) => setTimeout(resolve, 3000)),
	},
}

export const WithError: Story = {
	args: {
		initialData: {
			title: "Sample Book Title",
			description: "This is a sample description for the audiobook.",
			privateUserNote: "Personal notes about this book",
		},
		onSubmit: fn(),
		error: "An external error occurred while processing your request.",
	},
}

export const WithErrorJSX: Story = {
	args: {
		initialData: {
			title: "Sample Book Title",
			description: "This is a sample description for the audiobook.",
			privateUserNote: "Personal notes about this book",
		},
		onSubmit: fn(),
		error: (
			<div>
				<strong>Server Error:</strong> Unable to connect to the server.{" "}
				<br />
				Please check your internet connection and try again.
			</div>
		),
	},
}

export const WithLongError: Story = {
	args: {
		initialData: {
			title: "Sample Book Title",
			description: "This is a sample description for the audiobook.",
			privateUserNote: "Personal notes about this book",
		},
		onSubmit: fn(),
		error: "This is a very long error message that demonstrates how the error alert handles extensive text content. It includes multiple sentences to show how the error display behaves with longer content that might wrap to multiple lines in the user interface.",
	},
}
