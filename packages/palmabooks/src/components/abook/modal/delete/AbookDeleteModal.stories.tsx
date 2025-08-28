import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "storybook/test"
import { AbookDeleteModal } from "./AbookDeleteModal"

const meta: Meta<typeof AbookDeleteModal> = {
	title: "Components/Abook/Modal/AbookDeleteModal",
	component: AbookDeleteModal,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"A modal component for confirming audiobook deletion. Displays a warning and requires user confirmation before proceeding with the delete action.",
			},
		},
	},
	decorators: [
		(Story) => (
			<div style={{ minHeight: "100vh", padding: "20px" }}>
				<Story />
			</div>
		),
	],
	tags: ["autodocs"],
	argTypes: {
		opened: {
			control: "boolean",
			description: "Controls whether the modal is visible",
		},
		abookTitle: {
			control: "text",
			description: "The title of the audiobook to be deleted",
		},
		onClose: {
			description: "Callback function called when modal is closed",
		},
		onConfirmDelete: {
			description: "Callback function called when delete is confirmed",
		},
	},
}

export default meta
type Story = StoryObj<typeof AbookDeleteModal>

// Default story with audiobook selected
export const Default: Story = {
	args: {
		opened: true,
		abookTitle: "The Great Gatsby",
		onClose: fn(),
		onConfirmDelete: fn(),
	},
}

// Story with a long title
export const WithLongTitle: Story = {
	args: {
		opened: true,
		abookTitle:
			"The Extremely Long Title of a Very Important Audiobook That Has Many Words and Covers Multiple Topics",
		onClose: fn(),
		onConfirmDelete: fn(),
	},
}

// Story that simulates successful deletion
export const SuccessfulDeletion: Story = {
	args: {
		opened: true,
		abookTitle: "Sample Audiobook",
		onClose: fn(),
		onConfirmDelete: fn(async () => {
			// Simulate successful deletion
			return new Promise<void>((resolve) => {
				setTimeout(resolve, 1000)
			})
		}),
	},
}

// Story that simulates deletion error
export const DeletionError: Story = {
	args: {
		opened: true,
		abookTitle: "Sample Audiobook",
		onClose: fn(),
		onConfirmDelete: fn(async () => {
			// Simulate deletion error
			return new Promise<void>((_, reject) => {
				reject(new Error("Failed to delete audiobook"))
			})
		}),
	},
}

// Story that simulates slow deletion (long loading state)
export const SlowDeletion: Story = {
	args: {
		opened: true,
		abookTitle: "Large Audiobook File",
		onClose: fn(),
		onConfirmDelete: fn(() => {
			return new Promise<void>((resolve) => {
				setTimeout(resolve, 5000)
			})
		}),
	},
}

// Story with modal closed (for testing props changes)
export const Closed: Story = {
	args: {
		opened: false,
		abookTitle: "The Great Gatsby",
		onClose: fn(),
		onConfirmDelete: fn(),
	},
}

// Story with special characters in title
export const WithSpecialCharacters: Story = {
	args: {
		opened: true,
		abookTitle:
			"The Symbol: A Study of Special Characters and Their Usage in Titles (2024)",
		onClose: fn(),
		onConfirmDelete: fn(),
	},
}

// Story with empty string title (edge case)
export const WithEmptyTitle: Story = {
	args: {
		opened: true,
		abookTitle: "",
		onClose: fn(),
		onConfirmDelete: fn(),
	},
}

// Story with whitespace-only title (edge case)
export const WithWhitespaceTitle: Story = {
	args: {
		opened: true,
		abookTitle: "   ",
		onClose: fn(),
		onConfirmDelete: fn(),
	},
}
