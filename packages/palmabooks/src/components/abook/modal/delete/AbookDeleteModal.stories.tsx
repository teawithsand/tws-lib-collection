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

export const Default: Story = {
	args: {
		opened: true,
		abookTitle: "The Great Gatsby",
		onClose: fn(),
		onConfirmDelete: fn(),
	},
}

export const WithLongTitle: Story = {
	args: {
		opened: true,
		abookTitle:
			"The Extremely Long Title of a Very Important Audiobook That Has Many Words and Covers Multiple Topics",
		onClose: fn(),
		onConfirmDelete: fn(),
	},
}

export const SuccessfulDeletion: Story = {
	args: {
		opened: true,
		abookTitle: "Sample Audiobook",
		onClose: fn(),
		onConfirmDelete: fn(async () => {
			return new Promise<void>((resolve) => {
				setTimeout(resolve, 1000)
			})
		}),
	},
}

export const DeletionError: Story = {
	args: {
		opened: true,
		abookTitle: "Sample Audiobook",
		onClose: fn(),
		onConfirmDelete: fn(async () => {
			return new Promise<void>((_, reject) => {
				reject(new Error("Failed to delete audiobook"))
			})
		}),
	},
}

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

export const Closed: Story = {
	args: {
		opened: false,
		abookTitle: "The Great Gatsby",
		onClose: fn(),
		onConfirmDelete: fn(),
	},
}

export const WithSpecialCharacters: Story = {
	args: {
		opened: true,
		abookTitle:
			"The Symbol: A Study of Special Characters and Their Usage in Titles (2024)",
		onClose: fn(),
		onConfirmDelete: fn(),
	},
}

export const WithEmptyTitle: Story = {
	args: {
		opened: true,
		abookTitle: "",
		onClose: fn(),
		onConfirmDelete: fn(),
	},
}

export const WithWhitespaceTitle: Story = {
	args: {
		opened: true,
		abookTitle: "   ",
		onClose: fn(),
		onConfirmDelete: fn(),
	},
}
