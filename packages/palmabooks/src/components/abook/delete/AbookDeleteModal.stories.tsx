import type { Meta, StoryObj } from "@storybook/react"
import { Abook } from "@teawithsand/booklibr"
import { Timestamp } from "@teawithsand/lngext"
import { AbookDeleteModal } from "./AbookDeleteModal"

/**
 * Create a mock audiobook for testing
 */
const createMockAbook = (options: {
	title?: string
	entryCount?: number
}): Abook => {
	const { title = "The Hitchhiker's Guide to the Galaxy", entryCount = 12 } =
		options

	return new Abook({
		data: {
			header: {
				createdAt: Timestamp.fromNumber(Date.now()),
				metadata: {
					title,
					description: "A humorous science fiction series",
					privateUserNote: "",
				},
				position: null,
			},
			entries: new Map(),
		},
		aggregate: {
			totalEntries: entryCount,
			totalDurationMillis: 6 * 60 * 60 * 1000,
		},
	})
}

const meta: Meta<typeof AbookDeleteModal> = {
	title: "Components/Abook/AbookDeleteModal",
	component: AbookDeleteModal,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"A confirmation modal for deleting audiobooks. Shows audiobook details and requires user confirmation before deletion.",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		opened: {
			control: "boolean",
			description: "Whether the modal is open",
		},
		onClose: {
			description: "Callback when modal is closed",
		},
		abook: {
			control: "object",
			description: "The audiobook to delete",
		},
		onDelete: {
			description: "Callback to trigger deletion",
		},
		isDeleting: {
			control: "boolean",
			description: "Whether deletion is in progress",
		},
		deleteError: {
			control: "text",
			description: "Error message if deletion failed",
		},
		deleteSuccess: {
			control: "boolean",
			description: "Whether deletion was successful",
		},
	},
}

export default meta
type Story = StoryObj<typeof AbookDeleteModal>

export const Default: Story = {
	args: {
		opened: true,
		onClose: () => {},
		abook: createMockAbook({}),
		onDelete: () => {},
		isDeleting: false,
		deleteError: null,
		deleteSuccess: false,
	},
}

export const WithShortTitle: Story = {
	args: {
		opened: true,
		onClose: () => {},
		abook: createMockAbook({ title: "1984" }),
		onDelete: () => {},
		isDeleting: false,
		deleteError: null,
		deleteSuccess: false,
	},
}

export const WithLongTitle: Story = {
	args: {
		opened: true,
		onClose: () => {},
		abook: createMockAbook({
			title: "The Very Long Title of an Audiobook That Should Still Display Correctly in the Modal Dialog",
		}),
		onDelete: () => {},
		isDeleting: false,
		deleteError: null,
		deleteSuccess: false,
	},
}

export const WithManyEntries: Story = {
	args: {
		opened: true,
		onClose: () => {},
		abook: createMockAbook({ entryCount: 150 }),
		onDelete: () => {},
		isDeleting: false,
		deleteError: null,
		deleteSuccess: false,
	},
}

export const WithSingleEntry: Story = {
	args: {
		opened: true,
		onClose: () => {},
		abook: createMockAbook({ entryCount: 1 }),
		onDelete: () => {},
		isDeleting: false,
		deleteError: null,
		deleteSuccess: false,
	},
}

export const NoAbookSelected: Story = {
	args: {
		opened: true,
		onClose: () => {},
		abook: null,
		onDelete: () => {},
		isDeleting: false,
		deleteError: null,
		deleteSuccess: false,
	},
}

export const Closed: Story = {
	args: {
		opened: false,
		onClose: () => {},
		abook: createMockAbook({}),
		onDelete: () => {},
		isDeleting: false,
		deleteError: null,
		deleteSuccess: false,
	},
}

export const WithError: Story = {
	args: {
		opened: true,
		onClose: () => {},
		abook: createMockAbook({}),
		onDelete: () => {},
		isDeleting: false,
		deleteError: "Failed to delete audiobook. The file might be in use.",
		deleteSuccess: false,
	},
}

export const Deleting: Story = {
	args: {
		opened: true,
		onClose: () => {},
		abook: createMockAbook({}),
		onDelete: () => {},
		isDeleting: true,
		deleteError: null,
		deleteSuccess: false,
	},
}

export const Success: Story = {
	args: {
		opened: true,
		onClose: () => {},
		abook: createMockAbook({}),
		onDelete: () => {},
		isDeleting: false,
		deleteError: null,
		deleteSuccess: true,
	},
}
