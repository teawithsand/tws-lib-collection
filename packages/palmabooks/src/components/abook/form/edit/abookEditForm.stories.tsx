import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "storybook/test"
import { AbookEditForm } from "./abookEditForm"

const meta: Meta<typeof AbookEditForm> = {
	title: "Components/Abook/Form/AbookEditForm",
	component: AbookEditForm,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"A form component for editing existing audiobooks. Includes validation for title, description, and private notes with cancel functionality.",
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
type Story = StoryObj<typeof AbookEditForm>

export const Default: Story = {
	args: {
		initialData: {
			title: "The Great Gatsby",
			description:
				"A classic American novel by F. Scott Fitzgerald, set in the summer of 1922.",
			privateUserNote: "Started reading this for book club",
		},
		onSubmit: fn(),
		onCancel: fn(),
	},
}

export const WithMinimalData: Story = {
	args: {
		initialData: {
			title: "Sample Book",
			description: "",
			privateUserNote: "",
		},
		onSubmit: fn(),
		onCancel: fn(),
	},
}

export const WithRichContent: Story = {
	args: {
		initialData: {
			title: "To Kill a Mockingbird",
			description:
				"A gripping, heart-wrenching, and wholly remarkable tale of coming-of-age in a South poisoned by virulent prejudice, it views a world of great beauty and savage inequities through the eyes of a young girl, as her father—a crusading local lawyer—risks everything to defend a black man unjustly accused of a terrible crime.",
			privateUserNote:
				"One of my favorite books. The narration by Scout is particularly compelling. Important themes about justice, morality, and growing up. Would recommend to anyone interested in American literature.\n\nNotes for discussion:\n- Symbolism of the mockingbird\n- Character development of Jem and Scout\n- Social commentary on 1930s Alabama",
		},
		onSubmit: fn(),
		onCancel: fn(),
	},
}

export const WithAsyncSubmission: Story = {
	args: {
		initialData: {
			title: "1984",
			description:
				"A dystopian social science fiction novel by George Orwell.",
			privateUserNote: "Re-reading this classic",
		},
		onSubmit: fn(() => {
			return new Promise<void>((resolve) => {
				setTimeout(resolve, 2000)
			})
		}),
		onCancel: fn(),
	},
}

export const WithSubmissionError: Story = {
	args: {
		initialData: {
			title: "Brave New World",
			description: "A dystopian novel by Aldous Huxley.",
			privateUserNote: "Interesting comparison to 1984",
		},
		onSubmit: fn(() => {
			return new Promise<void>((_, reject) => {
				setTimeout(() => {
					reject(new Error("Failed to update audiobook"))
				}, 1000)
			})
		}),
		onCancel: fn(),
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
		onCancel: fn(),
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
		onCancel: fn(),
	},
}

export const WithoutCancel: Story = {
	args: {
		initialData: {
			title: "The Catcher in the Rye",
			description:
				"A novel by J.D. Salinger about teenage rebellion and angst.",
			privateUserNote: "Classic coming-of-age story",
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
		onCancel: fn(),
	},
}

export const WithError: Story = {
	args: {
		initialData: {
			title: "The Great Gatsby",
			description:
				"A classic American novel by F. Scott Fitzgerald, set in the summer of 1922.",
			privateUserNote: "Started reading this for book club",
		},
		onSubmit: fn(),
		onCancel: fn(),
		error: "An external error occurred while processing your request.",
	},
}

export const WithErrorJSX: Story = {
	args: {
		initialData: {
			title: "The Great Gatsby",
			description:
				"A classic American novel by F. Scott Fitzgerald, set in the summer of 1922.",
			privateUserNote: "Started reading this for book club",
		},
		onSubmit: fn(),
		onCancel: fn(),
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
			title: "The Great Gatsby",
			description:
				"A classic American novel by F. Scott Fitzgerald, set in the summer of 1922.",
			privateUserNote: "Started reading this for book club",
		},
		onSubmit: fn(),
		onCancel: fn(),
		error: "This is a very long error message that demonstrates how the error alert handles extensive text content. It includes multiple sentences to show how the error display behaves with longer content that might wrap to multiple lines in the user interface.",
	},
}
