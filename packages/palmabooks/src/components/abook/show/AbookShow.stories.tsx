import type { Meta, StoryObj } from "@storybook/react"
import {
	Abook,
	AbookAggregateData,
	AbookData,
	AbookEntry,
	AbookEntryDisposition,
	AbookEntrySourceType,
	BlobMetadataResultType,
	WithId,
} from "@teawithsand/booklibr"
import { Timestamp } from "@teawithsand/lngext"
import { Container } from "@teawithsand/mlui"
import { SimpleSerializedError } from "@teawithsand/reserd"
import { fn } from "storybook/test"
import { AbookShow } from "./AbookShow"

const createMockAbookData = (entries: WithId<AbookEntry>[]): AbookData => {
	const entriesMap = new Map<string, AbookEntry>()
	entries.forEach((entry) => {
		entriesMap.set(entry.id.toString(), entry.data)
	})

	return {
		header: {
			createdAt: Timestamp.fromNumber(1672531200000),
			metadata: {
				title: "The Great Gatsby",
				description:
					"A classic American novel by F. Scott Fitzgerald about the Jazz Age in the United States.",
				privateUserNote: "One of my favorite classics",
			},
			position: null,
		},
		entries: entriesMap,
	}
}

const createMockEntry = (
	id: string,
	disposition: AbookEntryDisposition,
	audioDuration?: number,
	hasMetadata = true,
	metadataType: BlobMetadataResultType = BlobMetadataResultType.SUCCESS,
	fileName = "audio-file.mp3",
): WithId<AbookEntry> => {
	return {
		id,
		data: new AbookEntry({
			data: {
				createdAt: Timestamp.fromNumber(1672531200000),
				disposition,
				source: {
					type: AbookEntrySourceType.UPLOAD,
					uploadedAt: 1672531200000,
					uploadFileName: fileName,
					uploadFileMime: "audio/mpeg",
				},
			},
			aggregate: {
				metadata: hasMetadata
					? {
							extractTimestamp:
								Timestamp.fromNumber(1672531200000),
							extractSource: {
								type: AbookEntrySourceType.UPLOAD,
							},
							metadata: {
								audio:
									metadataType ===
									BlobMetadataResultType.SUCCESS
										? {
												type: BlobMetadataResultType.SUCCESS,
												metadata: {
													duration:
														audioDuration ?? 1000,
												},
											}
										: {
												type: BlobMetadataResultType.ERROR,
												error: SimpleSerializedError.fromAny(
													"Metadata extraction failed",
												),
											},
								image: {
									type: BlobMetadataResultType.ERROR,
									error: SimpleSerializedError.fromAny(
										"Not an image",
									),
								},
							},
						}
					: null,
				blobSize: 1024 * 1024, // 1MB
			},
		}),
	}
}

const createMockAbook = (
	entries: WithId<AbookEntry>[],
	title = "The Great Gatsby",
	description?: string,
): Abook => {
	const data = createMockAbookData(entries)
	data.header.metadata.title = title
	if (description !== undefined) {
		data.header.metadata.description = description
	}

	const totalEntries = entries.length
	const totalDurationMillis = entries.reduce((total, entry) => {
		if (
			entry.data.data.disposition ===
				AbookEntryDisposition.PLAYABLE_AUDIO &&
			entry.data.aggregate.metadata?.metadata.audio.type ===
				BlobMetadataResultType.SUCCESS
		) {
			const audioMetadata = entry.data.aggregate.metadata.metadata
				.audio as {
				type: BlobMetadataResultType.SUCCESS
				metadata: { duration: number }
			}
			return total + audioMetadata.metadata.duration * 1000
		}
		return total
	}, 0)

	const aggregate: AbookAggregateData = {
		totalEntries,
		totalDurationMillis,
	}

	return new Abook({ data, aggregate })
}

const sampleEntries: WithId<AbookEntry>[] = [
	createMockEntry(
		"entry-1",
		AbookEntryDisposition.PLAYABLE_AUDIO,
		3600,
		true,
		BlobMetadataResultType.SUCCESS,
		"chapter-01.mp3",
	),
	createMockEntry(
		"entry-2",
		AbookEntryDisposition.PLAYABLE_AUDIO,
		2400,
		true,
		BlobMetadataResultType.SUCCESS,
		"chapter-02.mp3",
	),
	createMockEntry(
		"entry-3",
		AbookEntryDisposition.PLAYABLE_AUDIO,
		1800,
		true,
		BlobMetadataResultType.SUCCESS,
		"chapter-03.mp3",
	),
	createMockEntry(
		"entry-4",
		AbookEntryDisposition.COVER_IMAGE,
		0,
		false,
		BlobMetadataResultType.ERROR,
		"cover.jpg",
	),
]

const sampleAbook = createMockAbook(sampleEntries)

const meta: Meta<typeof AbookShow> = {
	title: "Components/Abook/Show/AbookShow",
	component: AbookShow,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"A comprehensive component for displaying audiobook details including metadata, entries, and action buttons. Shows the audiobook title, description, statistics, and a list of all entries with their details.",
			},
		},
	},
	decorators: [
		(Story) => (
			<Container py="md">
				<Story />
			</Container>
		),
	],
	tags: ["autodocs"],
	argTypes: {
		abook: {
			control: false,
			description: "The audiobook data to display",
		},
		abookEntries: {
			control: false,
			description: "Array of audiobook entries with metadata",
		},
		abookId: {
			control: "text",
			description: "Unique identifier for the audiobook",
		},
		onEditClick: {
			description: "Callback function called when edit button is clicked",
		},
		onDeleteClick: {
			description:
				"Callback function called when delete button is clicked",
		},
		onUploadClick: {
			description:
				"Callback function called when upload button is clicked",
		},
		onFileListClick: {
			description:
				"Callback function called when file list button is clicked",
		},
	},
}

export default meta
type Story = StoryObj<typeof AbookShow>

export const Default: Story = {
	args: {
		abook: sampleAbook,
		abookEntries: sampleEntries,
		abookId: "sample-abook-id",
		onEditClick: fn(),
		onDeleteClick: fn(),
		onUploadClick: fn(),
		onFileListClick: fn(),
	},
}

export const WithLongContent: Story = {
	args: {
		abook: createMockAbook(
			sampleEntries,
			"The Extremely Long Title of a Very Important Audiobook That Spans Multiple Lines and Contains Many Words",
			"This is an exceptionally detailed description of an audiobook that contains a lot of information about the content, themes, characters, and plot. It goes on for quite a while to demonstrate how the component handles longer text content and whether it wraps properly or gets truncated in the interface.",
		),
		abookEntries: sampleEntries,
		abookId: "long-content-abook",
		onEditClick: fn(),
		onDeleteClick: fn(),
		onUploadClick: fn(),
		onFileListClick: fn(),
	},
}

export const EmptyAudiobook: Story = {
	args: {
		abook: createMockAbook(
			[],
			"Empty Audiobook",
			"An audiobook with no entries",
		),
		abookEntries: [],
		abookId: "empty-abook",
		onEditClick: fn(),
		onDeleteClick: fn(),
		onUploadClick: fn(),
		onFileListClick: fn(),
	},
}

export const EditOnlyActions: Story = {
	args: {
		abook: sampleAbook,
		abookEntries: sampleEntries,
		abookId: "edit-only-abook",
		onEditClick: fn(),
		onDeleteClick: undefined,
		onUploadClick: undefined,
	},
}

export const DeleteOnlyActions: Story = {
	args: {
		abook: sampleAbook,
		abookEntries: sampleEntries,
		abookId: "delete-only-abook",
		onEditClick: undefined,
		onDeleteClick: fn(),
		onUploadClick: undefined,
		onFileListClick: undefined,
	},
}

export const ReadOnlyMode: Story = {
	args: {
		abook: sampleAbook,
		abookEntries: sampleEntries,
		abookId: "readonly-abook",
		onEditClick: undefined,
		onDeleteClick: undefined,
		onUploadClick: undefined,
		onFileListClick: undefined,
	},
}

export const UploadOnlyActions: Story = {
	args: {
		abook: sampleAbook,
		abookEntries: sampleEntries,
		abookId: "upload-only-abook",
		onEditClick: undefined,
		onDeleteClick: undefined,
		onUploadClick: fn(),
		onFileListClick: undefined,
	},
}
