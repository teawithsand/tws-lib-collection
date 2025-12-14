import type { Meta, StoryObj } from "@storybook/react"
import {
	Abook,
	AbookEntry,
	AbookEntryDisposition,
	AbookEntrySourceType,
	BlobMetadataResultType,
	WithId,
} from "@teawithsand/booklibr"
import { Timestamp } from "@teawithsand/lngext"
import { SimpleSerializedError } from "@teawithsand/reserd"
import { AbookEntryShowModal } from "./AbookEntryShowModal"

/**
 * Create a mock audiobook entry for testing
 */
const createMockEntry = (options: {
	name?: string
	disposition?: AbookEntryDisposition
	ordinalNumber?: number
	duration?: number
	fileSize?: number
	sourceType?: "upload" | "url"
}): WithId<AbookEntry | null> => {
	const {
		name = "Chapter 1 - Introduction",
		disposition = AbookEntryDisposition.PLAYABLE_AUDIO,
		ordinalNumber = 1,
		duration = 3600000,
		fileSize = 15728640,
		sourceType = "upload",
	} = options

	const now = Timestamp.fromNumber(Date.now())

	return {
		id: "entry_1",
		data: new AbookEntry({
			data: {
				createdAt: now,
				name,
				disposition,
				ordinalNumber,
				source:
					sourceType === "upload"
						? {
								type: AbookEntrySourceType.UPLOAD,
								uploadedAt: now,
								uploadFileName: "chapter-1.mp3",
								uploadFileMime: "audio/mpeg",
							}
						: {
								type: AbookEntrySourceType.URL,
								url: "https://example.com/audio.mp3",
							},
			},
			aggregate: {
				metadata:
					disposition === AbookEntryDisposition.PLAYABLE_AUDIO &&
					duration
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
				blobSize: fileSize,
			},
		}),
	}
}

/**
 * Create a mock audiobook for testing
 */
const createMockAbook = (): WithId<Abook | null> => {
	const now = Timestamp.fromNumber(Date.now())
	return {
		id: "abook_1",
		data: new Abook({
			data: {
				header: {
					createdAt: now,
					metadata: {
						title: "My Audiobook",
						description: "A sample audiobook",
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
		}),
	}
}

const handleDeleteClick = () => {
	alert(`Delete clicked`)
}

const meta: Meta<typeof AbookEntryShowModal> = {
	title: "Components/Abook/Entries/AbookEntryShowModal",
	component: AbookEntryShowModal,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"A modal for displaying detailed information about an audiobook entry. Shows disposition, file information, source details, and timestamps in a mobile-first design. Includes delete functionality.",
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
			description: "The audiobook containing this entry",
		},
		entry: {
			control: "object",
			description: "The audiobook entry to show",
		},
		onDeleteClick: {
			description: "Callback when delete button is clicked",
		},
	},
}

export default meta
type Story = StoryObj<typeof AbookEntryShowModal>

export const PlayableAudio: Story = {
	args: {
		opened: true,
		onClose: () => {},
		abook: createMockAbook(),
		entry: createMockEntry({
			name: "Chapter 1 - The Beginning",
			disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
			ordinalNumber: 1,
			duration: 3600000, // 1 hour
			fileSize: 15728640, // 15 MB
		}),
		onDeleteClick: handleDeleteClick,
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
			fileSize: 524288, // 512 KB
		}),
		onDeleteClick: handleDeleteClick,
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
			fileSize: 4096, // 4 KB
		}),
		onDeleteClick: handleDeleteClick,
	},
}

export const UnknownDisposition: Story = {
	args: {
		opened: true,
		onClose: () => {},
		abook: createMockAbook(),
		entry: createMockEntry({
			name: "Unknown File",
			disposition: AbookEntryDisposition.UNKNOWN,
			ordinalNumber: 5,
			duration: undefined,
			fileSize: 1024000,
		}),
		onDeleteClick: handleDeleteClick,
	},
}

export const LongFileName: Story = {
	args: {
		opened: true,
		onClose: () => {},
		abook: createMockAbook(),
		entry: createMockEntry({
			name: "Chapter 25 - A Very Long Chapter Title That Goes On And On With Lots of Detail About What Happens In This Chapter",
			disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
			ordinalNumber: 25,
			duration: 5400000, // 1.5 hours
			fileSize: 52428800, // 50 MB
		}),
		onDeleteClick: handleDeleteClick,
	},
}

export const ShortDuration: Story = {
	args: {
		opened: true,
		onClose: () => {},
		abook: createMockAbook(),
		entry: createMockEntry({
			name: "Short Intro",
			disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
			ordinalNumber: 1,
			duration: 45000, // 45 seconds
			fileSize: 720896, // 704 KB
		}),
		onDeleteClick: handleDeleteClick,
	},
}

export const UrlSource: Story = {
	args: {
		opened: true,
		onClose: () => {},
		abook: createMockAbook(),
		entry: createMockEntry({
			name: "Chapter from URL",
			disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
			ordinalNumber: 3,
			duration: 2700000, // 45 minutes
			fileSize: 10485760, // 10 MB
			sourceType: "url",
		}),
		onDeleteClick: handleDeleteClick,
	},
}

export const LargeFile: Story = {
	args: {
		opened: true,
		onClose: () => {},
		abook: createMockAbook(),
		entry: createMockEntry({
			name: "Full Audiobook",
			disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
			ordinalNumber: 1,
			duration: 36000000, // 10 hours
			fileSize: 1073741824, // 1 GB
		}),
		onDeleteClick: handleDeleteClick,
	},
}

export const NoEntry: Story = {
	args: {
		opened: true,
		onClose: () => {},
		abook: createMockAbook(),
		entry: { id: "entry_null", data: null },
	},
}

export const Closed: Story = {
	args: {
		opened: false,
		onClose: () => {},
		abook: createMockAbook(),
		entry: createMockEntry({}),
		onDeleteClick: handleDeleteClick,
	},
}

export const NoDeleteCallback: Story = {
	args: {
		opened: true,
		onClose: () => {},
		abook: createMockAbook(),
		entry: createMockEntry({
			name: "Chapter Without Delete",
			disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
		}),
		// No onDeleteClick - delete button should be disabled
	},
}
