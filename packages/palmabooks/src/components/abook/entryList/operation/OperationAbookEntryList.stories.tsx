/**
 * Stories for OperationAbookEntryList component.
 *
 * The component focuses on bulk operations:
 * - Shows checkboxes for entry selection
 * - Displays disposition as badges (read-only)
 * - Supports bulk operations via action menu
 * - Includes filtering capabilities
 */

import type { Meta, StoryObj } from "@storybook/react"
import {
	AbookEntry,
	AbookEntryDisposition,
	AbookEntrySourceType,
	BlobMetadataResultType,
	WithId,
} from "@teawithsand/booklibr"
import { Timestamp } from "@teawithsand/lngext"
import { Container } from "@teawithsand/mlui"
import { fn } from "storybook/test"
import { AbookEntryAction, AbookEntryDisplayItem } from "../common"
import { OperationAbookEntryList } from "./OperationAbookEntryList"

const createMockAbookEntry = (
	id: string,
	fileName: string,
	disposition: AbookEntryDisposition,
	blobSize: number = 2500000,
	withMetadata: boolean = false,
): WithId<AbookEntry> => ({
	id,
	data: new AbookEntry({
		data: {
			createdAt: Timestamp.fromNumber(
				Date.now() - Math.random() * 86400000,
			),
			disposition,
			source: {
				type: AbookEntrySourceType.UPLOAD,
				uploadedAt: Date.now() - Math.random() * 86400000,
				uploadFileName: fileName,
				uploadFileMime:
					disposition === AbookEntryDisposition.PLAYABLE_AUDIO
						? "audio/mpeg"
						: "image/jpeg",
			},
		},
		aggregate: {
			metadata: withMetadata
				? {
						extractTimestamp: Timestamp.fromNumber(Date.now()),
						extractSource: {
							type: AbookEntrySourceType.UPLOAD,
						},
						metadata: {
							audio:
								disposition ===
								AbookEntryDisposition.PLAYABLE_AUDIO
									? {
											type: BlobMetadataResultType.SUCCESS,
											metadata: {
												duration:
													Math.floor(
														Math.random() * 3600000,
													) + 60000,
											},
										}
									: {
											type: BlobMetadataResultType.ERROR,
											error: {
												name: "NotAudioError",
												message: "Not an audio file",
												type: "error",
												causeChain: [],
												equals: () => false,
											},
										},
							image:
								disposition ===
								AbookEntryDisposition.COVER_IMAGE
									? {
											type: BlobMetadataResultType.SUCCESS,
											metadata: {
												width:
													Math.floor(
														Math.random() * 1920,
													) + 400,
												height:
													Math.floor(
														Math.random() * 1080,
													) + 300,
											},
										}
									: {
											type: BlobMetadataResultType.ERROR,
											error: {
												name: "NotImageError",
												message: "Not an image file",
												type: "error",
												causeChain: [],
												equals: () => false,
											},
										},
						},
					}
				: null,
			blobSize,
		},
	}),
})

const mockEntries: WithId<AbookEntry>[] = [
	createMockAbookEntry(
		"1",
		"Chapter_01_Introduction.mp3",
		AbookEntryDisposition.PLAYABLE_AUDIO,
		5242880,
		true,
	),
	createMockAbookEntry(
		"2",
		"Chapter_02_Background.mp3",
		AbookEntryDisposition.PLAYABLE_AUDIO,
		7340032,
		true,
	),
	createMockAbookEntry(
		"3",
		"cover.jpg",
		AbookEntryDisposition.COVER_IMAGE,
		204800,
		true,
	),
	createMockAbookEntry(
		"4",
		"notes.txt",
		AbookEntryDisposition.COVER_IMAGE,
		1024,
		false,
	),
	createMockAbookEntry(
		"5",
		"Chapter_03_Analysis.mp3",
		AbookEntryDisposition.PLAYABLE_AUDIO,
		6553600,
		true,
	),
]

const mockActions: AbookEntryAction[] = [
	{
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		name: (_t) => "Download Selected",
		onRun: fn(async (items: readonly AbookEntryDisplayItem[]) => {
			// eslint-disable-next-line no-console
			console.log(
				"Would download items:",
				items.map((item) => item.name),
			)
		}),
	},
	{
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		name: (_t) => "Export Selected",
		onRun: fn(async (items: readonly AbookEntryDisplayItem[]) => {
			// eslint-disable-next-line no-console
			console.log(
				"Would export items:",
				items.map((item) => item.name),
			)
		}),
	},
]

const meta = {
	title: "Components/Abook/EntryList/OperationAbookEntryList",
	component: OperationAbookEntryList,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"A list component focused on bulk operations. Users can select entries and perform actions on them.",
			},
		},
	},
	decorators: [
		(Story) => (
			<Container size="md" py="sm">
				<Story />
			</Container>
		),
	],
	argTypes: {
		entries: {
			control: false,
			description: "Array of abook entries to display",
		},
		actions: {
			control: false,
			description: "Actions that can be performed on selected entries",
		},
		showMetadata: {
			control: "boolean",
			description: "Whether to show metadata for entries",
		},
	},
} satisfies Meta<typeof OperationAbookEntryList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	args: {
		entries: mockEntries,
		actions: mockActions,
		showMetadata: true,
	},
}

export const WithoutActions: Story = {
	args: {
		entries: mockEntries,
		actions: [],
		showMetadata: true,
	},
}

export const WithoutMetadata: Story = {
	args: {
		entries: mockEntries,
		actions: mockActions,
		showMetadata: false,
	},
}

export const EmptyList: Story = {
	args: {
		entries: [],
		actions: mockActions,
		showMetadata: true,
	},
}

export const SingleEntry: Story = {
	args: {
		entries: [mockEntries[0]],
		actions: mockActions,
		showMetadata: true,
	},
}

export const LargeList: Story = {
	args: {
		entries: [
			...mockEntries,
			...Array.from({ length: 20 }, (_, i) =>
				createMockAbookEntry(
					`large-${i}`,
					`Chapter_${String(i + 6).padStart(2, "0")}_Content.mp3`,
					i % 2 === 0
						? AbookEntryDisposition.PLAYABLE_AUDIO
						: AbookEntryDisposition.COVER_IMAGE,
					Math.floor(Math.random() * 10000000) + 1000000,
					Math.random() > 0.3,
				),
			),
		],
		actions: mockActions,
		showMetadata: true,
	},
}

export const LongFileNames: Story = {
	args: {
		entries: [
			createMockAbookEntry(
				"long-1",
				"Chapter_01_Introduction_to_Advanced_Machine_Learning_Techniques_and_Their_Applications_in_Modern_Data_Science.mp3",
				AbookEntryDisposition.PLAYABLE_AUDIO,
				8500000,
				true,
			),
			createMockAbookEntry(
				"long-2",
				"A_Very_Long_Audio_Book_Chapter_Title_That_Exceeds_Normal_Length_Expectations_and_Tests_UI_Layout_Handling.mp3",
				AbookEntryDisposition.PLAYABLE_AUDIO,
				12000000,
				true,
			),
			createMockAbookEntry(
				"long-3",
				"High_Resolution_Book_Cover_Image_With_Extremely_Long_Filename_for_Testing_Text_Truncation_and_Mobile_Layout_Responsiveness.jpg",
				AbookEntryDisposition.COVER_IMAGE,
				2048000,
				true,
			),
			createMockAbookEntry(
				"long-4",
				"Some-Really-Long-File-Name-With-Hyphens-Instead-Of-Underscores-That-Should-Also-Be-Handled-Properly-By-The-UI-Components.txt",
				AbookEntryDisposition.COVER_IMAGE,
				5120,
				false,
			),
			createMockAbookEntry(
				"long-5",
				"AnExtremelyLongFileNameWithoutAnySpacesOrSeparatorsToTestWordBreakingAndTextWrappingInTheUserInterface.mp3",
				AbookEntryDisposition.PLAYABLE_AUDIO,
				9500000,
				true,
			),
		],
		actions: mockActions,
		showMetadata: true,
	},
}
