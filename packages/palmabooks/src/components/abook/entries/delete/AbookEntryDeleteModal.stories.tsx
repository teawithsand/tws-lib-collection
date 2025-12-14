import type { Meta, StoryObj } from "@storybook/react"
import {
	Abook,
	AbookEntry,
	AbookEntryDisposition,
	AbookEntrySourceType,
	BlobMetadataResultType,
} from "@teawithsand/booklibr"
import { Timestamp } from "@teawithsand/lngext"
import { SimpleSerializedError } from "@teawithsand/reserd"
import { AbookEntryDeleteModal } from "./AbookEntryDeleteModal"

/**
 * Create a mock abook for testing
 */
const createMockAbook = (options?: { title?: string }): Abook => {
	const { title = "Sample Audiobook" } = options ?? {}

	return new Abook({
		data: {
			header: {
				createdAt: Timestamp.fromNumber(Date.now()),
				metadata: {
					title,
					description: "A sample audiobook for testing",
					privateUserNote: "",
				},
				position: null,
			},
			entries: new Map(),
		},
		aggregate: {
			totalEntries: 5,
			totalDurationMillis: 18000000,
		},
	})
}

/**
 * Create a mock audiobook entry for testing
 */
const createMockEntry = (options?: {
	name?: string
	disposition?: AbookEntryDisposition
	ordinalNumber?: number
	duration?: number
}): AbookEntry => {
	const {
		name = "Chapter 1 - Introduction",
		disposition = AbookEntryDisposition.PLAYABLE_AUDIO,
		ordinalNumber = 1,
		duration = 3600000,
	} = options ?? {}

	const now = Timestamp.fromNumber(Date.now())

	return new AbookEntry({
		data: {
			createdAt: now,
			name,
			disposition,
			ordinalNumber,
			source: {
				type: AbookEntrySourceType.UPLOAD,
				uploadedAt: now,
				uploadFileName: "chapter-1.mp3",
				uploadFileMime: "audio/mpeg",
			},
		},
		aggregate: {
			metadata:
				disposition === AbookEntryDisposition.PLAYABLE_AUDIO && duration
					? {
							extractTimestamp: now,
							extractSource: {
								type: AbookEntrySourceType.UPLOAD,
							},
							metadata: {
								image: {
									type: BlobMetadataResultType.ERROR,
									error: SimpleSerializedError.fromAny(
										new Error("Not an image"),
									),
								},
								audio: {
									type: BlobMetadataResultType.SUCCESS,
									metadata: { duration },
								},
							},
						}
					: null,
			blobSize: 15728640, // 15 MB
		},
	})
}

const meta: Meta<typeof AbookEntryDeleteModal> = {
	title: "Components/Abook/Entries/AbookEntryDeleteModal",
	component: AbookEntryDeleteModal,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"A delete confirmation modal for audiobook entries. Shows entry and audiobook details, provides warnings about permanent deletion, and handles the deletion process with loading and error states. Uses mobile-first design principles.",
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
			description: "The audiobook containing the entry",
		},
		entry: {
			control: "object",
			description: "The entry to delete",
		},
		onDelete: {
			description: "Callback when delete is confirmed",
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
type Story = StoryObj<typeof AbookEntryDeleteModal>

export const Default: Story = {
	args: {
		opened: true,
		onClose: () => {},
		abook: createMockAbook(),
		entry: createMockEntry(),
		onDelete: () => {},
		isDeleting: false,
		deleteError: null,
		deleteSuccess: false,
	},
}

export const PlayableAudio: Story = {
	args: {
		opened: true,
		onClose: () => {},
		abook: createMockAbook({ title: "The Great Adventure" }),
		entry: createMockEntry({
			name: "Chapter 5 - The Journey Begins",
			disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
			ordinalNumber: 5,
			duration: 4500000, // 1 hour 15 minutes
		}),
		onDelete: () => {},
	},
}

export const CoverImage: Story = {
	args: {
		opened: true,
		onClose: () => {},
		abook: createMockAbook(),
		entry: createMockEntry({
			name: "Book Cover",
			disposition: AbookEntryDisposition.COVER_IMAGE,
			ordinalNumber: 0,
			duration: undefined,
		}),
		onDelete: () => {},
	},
}

export const Description: Story = {
	args: {
		opened: true,
		onClose: () => {},
		abook: createMockAbook(),
		entry: createMockEntry({
			name: "Book Description",
			disposition: AbookEntryDisposition.DESCRIPTION,
			ordinalNumber: 0,
			duration: undefined,
		}),
		onDelete: () => {},
	},
}

export const LongTitle: Story = {
	args: {
		opened: true,
		onClose: () => {},
		abook: createMockAbook({
			title: "A Very Long Audiobook Title That Goes On And On With Many Words",
		}),
		entry: createMockEntry({
			name: "Chapter 25 - A Very Long Chapter Title That Also Goes On And On With Lots of Detail",
			disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
			ordinalNumber: 25,
		}),
		onDelete: () => {},
	},
}

export const Deleting: Story = {
	args: {
		opened: true,
		onClose: () => {},
		abook: createMockAbook(),
		entry: createMockEntry(),
		onDelete: () => {},
		isDeleting: true,
	},
}

export const DeleteError: Story = {
	args: {
		opened: true,
		onClose: () => {},
		abook: createMockAbook(),
		entry: createMockEntry(),
		onDelete: () => {},
		isDeleting: false,
		deleteError: "Failed to delete entry: Network error occurred",
	},
}

export const DeleteSuccess: Story = {
	args: {
		opened: true,
		onClose: () => {},
		abook: createMockAbook(),
		entry: createMockEntry(),
		onDelete: () => {},
		isDeleting: false,
		deleteSuccess: true,
	},
}

export const NoEntry: Story = {
	args: {
		opened: true,
		onClose: () => {},
		abook: createMockAbook(),
		entry: null,
		onDelete: () => {},
	},
}

export const NoAbook: Story = {
	args: {
		opened: true,
		onClose: () => {},
		abook: null,
		entry: createMockEntry(),
		onDelete: () => {},
	},
}

export const Closed: Story = {
	args: {
		opened: false,
		onClose: () => {},
		abook: createMockAbook(),
		entry: createMockEntry(),
		onDelete: () => {},
	},
}

export const MobileView: Story = {
	args: {
		opened: true,
		onClose: () => {},
		abook: createMockAbook(),
		entry: createMockEntry(),
		onDelete: () => {},
	},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
	},
}
