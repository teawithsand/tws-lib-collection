import type { Meta, StoryObj } from "@storybook/react"
import {
	AbookEntry,
	AbookEntryDisposition,
	AbookEntrySourceType,
	BlobMetadataResultType,
	WithId,
} from "@teawithsand/booklibr"
import { atom } from "@teawithsand/fstate"
import { Timestamp } from "@teawithsand/lngext"
import { Container } from "@teawithsand/mlui"
import { SimpleSerializedError } from "@teawithsand/reserd"
import { AbookEntryList } from "./AbookEntryList"

/**
 * Create a mock audiobook entry for testing
 */
const createMockEntry = (
	id: string,
	ordinalNumber: number,
	name: string,
	disposition: AbookEntryDisposition,
	options: {
		durationMillis?: number
		blobSize?: number
		hasError?: boolean
	} = {},
): WithId<AbookEntry> => {
	const {
		durationMillis,
		blobSize = 1024 * 1024 * 5,
		hasError = false,
	} = options

	return {
		id,
		data: new AbookEntry({
			data: {
				createdAt: Timestamp.fromNumber(Date.now()),
				name,
				disposition,
				ordinalNumber,
				source: {
					type: AbookEntrySourceType.UPLOAD,
					uploadedAt: Timestamp.fromNumber(Date.now()),
					uploadFileName: name,
					uploadFileMime: "audio/mpeg",
				},
			},
			aggregate: {
				metadata: hasError
					? null
					: {
							extractTimestamp: Timestamp.fromNumber(Date.now()),
							extractSource: {
								type: AbookEntrySourceType.UPLOAD,
							},
							metadata: {
								image: {
									type: BlobMetadataResultType.ERROR,
									error: SimpleSerializedError.fromAny(
										new Error("No image"),
									),
								},
								audio:
									durationMillis !== undefined
										? {
												type: BlobMetadataResultType.SUCCESS,
												metadata: {
													duration: durationMillis,
												},
											}
										: {
												type: BlobMetadataResultType.ERROR,
												error: SimpleSerializedError.fromAny(
													new Error(
														"Failed to extract duration",
													),
												),
											},
							},
						},
				blobSize,
			},
		}),
	}
}

const meta: Meta<typeof AbookEntryList> = {
	title: "Components/Abook/Entries/AbookEntryList",
	component: AbookEntryList,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"A mobile-first audiobook entry list component that displays entries in a simple vertical list. Shows entry name, ordinal number, file size, and duration for audio entries.",
			},
		},
	},
	decorators: [
		(Story) => (
			<Container size="xl" py="xl">
				<Story />
			</Container>
		),
	],
	tags: ["autodocs"],
	argTypes: {
		entriesAtom: {
			control: "object",
			description:
				"Atom resolving to an array of audiobook entries to display",
		},
		onRefresh: {
			action: "refreshClicked",
			description: "Callback when refresh button is clicked",
		},
	},
}

export default meta
type Story = StoryObj<typeof AbookEntryList>

export const Empty: Story = {
	args: {
		entriesAtom: atom(Promise.resolve([])),
	},
}

export const SingleAudioEntry: Story = {
	args: {
		entriesAtom: atom(
			Promise.resolve([
				createMockEntry(
					"entry-1",
					1,
					"Chapter 1: The Beginning",
					AbookEntryDisposition.PLAYABLE_AUDIO,
					{
						durationMillis: 45 * 60 * 1000, // 45 minutes
						blobSize: 15 * 1024 * 1024, // 15 MB
					},
				),
			]),
		),
	},
}

export const MultipleAudioEntries: Story = {
	args: {
		entriesAtom: atom(
			Promise.resolve([
				createMockEntry(
					"entry-1",
					1,
					"Chapter 1: The Beginning",
					AbookEntryDisposition.PLAYABLE_AUDIO,
					{
						durationMillis: 45 * 60 * 1000, // 45 minutes
						blobSize: 15 * 1024 * 1024, // 15 MB
					},
				),
				createMockEntry(
					"entry-2",
					2,
					"Chapter 2: The Journey Continues",
					AbookEntryDisposition.PLAYABLE_AUDIO,
					{
						durationMillis: 52 * 60 * 1000, // 52 minutes
						blobSize: 18 * 1024 * 1024, // 18 MB
					},
				),
				createMockEntry(
					"entry-3",
					3,
					"Chapter 3: The Plot Thickens",
					AbookEntryDisposition.PLAYABLE_AUDIO,
					{
						durationMillis: 38 * 60 * 1000, // 38 minutes
						blobSize: 12 * 1024 * 1024, // 12 MB
					},
				),
			]),
		),
	},
}

export const MixedEntryTypes: Story = {
	args: {
		entriesAtom: atom(
			Promise.resolve([
				createMockEntry(
					"entry-cover",
					1,
					"Book Cover",
					AbookEntryDisposition.COVER_IMAGE,
					{
						blobSize: 500 * 1024, // 500 KB
					},
				),
				createMockEntry(
					"entry-desc",
					2,
					"Book Description",
					AbookEntryDisposition.DESCRIPTION,
					{
						blobSize: 10 * 1024, // 10 KB
					},
				),
				createMockEntry(
					"entry-1",
					3,
					"Chapter 1: Introduction",
					AbookEntryDisposition.PLAYABLE_AUDIO,
					{
						durationMillis: 30 * 60 * 1000, // 30 minutes
						blobSize: 10 * 1024 * 1024, // 10 MB
					},
				),
				createMockEntry(
					"entry-2",
					4,
					"Chapter 2: Development",
					AbookEntryDisposition.PLAYABLE_AUDIO,
					{
						durationMillis: 45 * 60 * 1000, // 45 minutes
						blobSize: 15 * 1024 * 1024, // 15 MB
					},
				),
				createMockEntry(
					"entry-unknown",
					5,
					"Unknown File",
					AbookEntryDisposition.UNKNOWN,
					{
						blobSize: 1 * 1024 * 1024, // 1 MB
					},
				),
			]),
		),
	},
}

export const LongDuration: Story = {
	args: {
		entriesAtom: atom(
			Promise.resolve([
				createMockEntry(
					"entry-1",
					1,
					"Full Book Recording",
					AbookEntryDisposition.PLAYABLE_AUDIO,
					{
						durationMillis: 12 * 60 * 60 * 1000, // 12 hours
						blobSize: 150 * 1024 * 1024, // 150 MB
					},
				),
				createMockEntry(
					"entry-2",
					2,
					"Epilogue",
					AbookEntryDisposition.PLAYABLE_AUDIO,
					{
						durationMillis: 2 * 60 * 60 * 1000, // 2 hours
						blobSize: 25 * 1024 * 1024, // 25 MB
					},
				),
			]),
		),
	},
}

export const ShortDuration: Story = {
	args: {
		entriesAtom: atom(
			Promise.resolve([
				createMockEntry(
					"entry-1",
					1,
					"Quick Introduction",
					AbookEntryDisposition.PLAYABLE_AUDIO,
					{
						durationMillis: 2 * 60 * 1000, // 2 minutes
						blobSize: 800 * 1024, // 800 KB
					},
				),
				createMockEntry(
					"entry-2",
					2,
					"Brief Summary",
					AbookEntryDisposition.PLAYABLE_AUDIO,
					{
						durationMillis: 5 * 60 * 1000, // 5 minutes
						blobSize: 2 * 1024 * 1024, // 2 MB
					},
				),
			]),
		),
	},
}

export const WithoutMetadata: Story = {
	args: {
		entriesAtom: atom(
			Promise.resolve([
				createMockEntry(
					"entry-1",
					1,
					"Chapter 1: Still Processing",
					AbookEntryDisposition.PLAYABLE_AUDIO,
					{
						hasError: true,
						blobSize: 15 * 1024 * 1024,
					},
				),
				createMockEntry(
					"entry-2",
					2,
					"Chapter 2: Also Processing",
					AbookEntryDisposition.PLAYABLE_AUDIO,
					{
						hasError: true,
						blobSize: 18 * 1024 * 1024,
					},
				),
			]),
		),
	},
}

export const LargeList: Story = {
	args: {
		entriesAtom: atom(
			Promise.resolve(
				Array.from({ length: 25 }, (_, i) =>
					createMockEntry(
						`entry-${i + 1}`,
						i + 1,
						`Chapter ${i + 1}: Part ${i + 1}`,
						AbookEntryDisposition.PLAYABLE_AUDIO,
						{
							durationMillis: (30 + (i % 20)) * 60 * 1000,
							blobSize: (10 + (i % 10)) * 1024 * 1024,
						},
					),
				),
			),
		),
	},
}
