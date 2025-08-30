import type { Meta, StoryObj } from "@storybook/react"
import { Container } from "@teawithsand/mlui"
import { useState } from "react"
import { fn } from "storybook/test"
import {
	AdvancedFileField,
	AdvancedFileFieldEntry,
	AdvancedFileFieldProps,
} from "./AdvancedFileField"
import { AdvancedFileFieldPreviewMode } from "./types"

const createMockFile = (name: string, type: string, size: number): File => {
	const file = new File(["mock content"], name, { type })
	Object.defineProperty(file, "size", { value: size })
	return file
}

const AdvancedFileFieldWrapper = (
	props: Omit<AdvancedFileFieldProps, "files" | "onFilesChange"> & {
		files?: AdvancedFileFieldEntry[]
	},
) => {
	const [files, setFiles] = useState<AdvancedFileFieldEntry[]>(
		props.files || [],
	)

	return (
		<AdvancedFileField {...props} files={files} onFilesChange={setFiles} />
	)
}

const meta: Meta<typeof AdvancedFileField> = {
	title: "Components/Field/AdvancedFileField",
	component: AdvancedFileFieldWrapper,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"A file picker field component that supports drag and drop, file selection, and directory selection. Displays selected files with metadata and provides file management capabilities.",
			},
		},
	},
	decorators: [
		(Story) => (
			<Container py="sm">
				<Story />
			</Container>
		),
	],
	tags: ["autodocs"],
	argTypes: {
		files: {
			control: false,
			description: "Array of selected files",
		},
		onFilesChange: {
			description: "Callback function called when files change",
		},
		accept: {
			control: "text",
			description: "File types to accept (e.g., '.jpg,.png,image/*')",
		},
		multiple: {
			control: "boolean",
			description: "Whether to allow multiple file selection",
		},
		allowDirectories: {
			control: "boolean",
			description: "Whether to allow directory selection",
		},
		disabled: {
			control: "boolean",
			description: "Whether the field is disabled",
		},
		label: {
			control: "text",
			description: "Custom label for the field",
		},
		description: {
			control: "text",
			description: "Custom description for the field",
		},
		placeholder: {
			control: "text",
			description: "Custom placeholder text",
		},
		error: {
			control: "text",
			description: "Error message to display",
		},
		previewMode: {
			control: "select",
			options: [
				AdvancedFileFieldPreviewMode.DISABLED,
				AdvancedFileFieldPreviewMode.ENABLED,
				AdvancedFileFieldPreviewMode.MODAL,
			],
			description: "How to display the selected files preview",
		},
	},
}

export default meta
type Story = StoryObj<typeof AdvancedFileField>

export const Default: Story = {
	args: {
		files: [],
		onFilesChange: fn(),
		multiple: true,
		allowDirectories: true,
		disabled: false,
	},
}

export const WithCustomLabels: Story = {
	args: {
		files: [],
		onFilesChange: fn(),
		label: "Upload Documents",
		description:
			"Please upload your important documents here. Supported formats: PDF, DOC, DOCX",
		placeholder: "Drop your documents here or click to browse",
		multiple: true,
		allowDirectories: true,
		disabled: false,
	},
}

export const WithFiles: Story = {
	args: {
		files: [
			{
				id: "1",
				file: createMockFile(
					"document.pdf",
					"application/pdf",
					1024 * 1024 * 2.5,
				),
			},
			{
				id: "2",
				file: createMockFile("image.jpg", "image/jpeg", 1024 * 512),
			},
			{
				id: "3",
				file: createMockFile(
					"spreadsheet.xlsx",
					"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
					1024 * 1024 * 1.2,
				),
			},
		],
		onFilesChange: fn(),
		multiple: true,
		allowDirectories: true,
		disabled: false,
	},
}

export const SingleFile: Story = {
	args: {
		files: [],
		onFilesChange: fn(),
		multiple: false,
		allowDirectories: false,
		disabled: false,
		label: "Profile Picture",
		description: "Upload a single profile picture",
		accept: "image/*",
	},
}

export const SingleFileUploaded: Story = {
	args: {
		files: [
			{
				id: "1",
				file: createMockFile("profile.jpg", "image/jpeg", 1024 * 256),
			},
		],
		onFilesChange: fn(),
		multiple: false,
		allowDirectories: false,
		disabled: false,
		label: "Profile Picture",
		description: "Upload a single profile picture",
		accept: "image/*",
	},
}

export const ImagesOnly: Story = {
	args: {
		files: [
			{
				id: "1",
				file: createMockFile(
					"photo1.jpg",
					"image/jpeg",
					1024 * 1024 * 3.2,
				),
			},
			{
				id: "2",
				file: createMockFile(
					"photo2.png",
					"image/png",
					1024 * 1024 * 1.8,
				),
			},
			{
				id: "3",
				file: createMockFile("photo3.gif", "image/gif", 1024 * 512),
			},
		],
		onFilesChange: fn(),
		accept: "image/*",
		multiple: true,
		allowDirectories: false,
		disabled: false,
		label: "Photo Gallery",
		description: "Upload images for your gallery",
	},
}

export const NoDirectories: Story = {
	args: {
		files: [],
		onFilesChange: fn(),
		multiple: true,
		allowDirectories: false,
		disabled: false,
		label: "File Upload",
		description: "Directory upload is disabled for this field",
	},
}

export const Disabled: Story = {
	args: {
		files: [
			{
				id: "1",
				file: createMockFile("readonly.txt", "text/plain", 1024),
			},
		],
		onFilesChange: fn(),
		multiple: true,
		allowDirectories: true,
		disabled: true,
		label: "Read-only Files",
		description: "This field is disabled and files cannot be modified",
	},
}

export const WithError: Story = {
	args: {
		files: [],
		onFilesChange: fn(),
		multiple: true,
		allowDirectories: true,
		disabled: false,
		error: "File upload failed. Please try again.",
	},
}

export const ManyFiles: Story = {
	args: {
		files: [
			{
				id: "1",
				file: createMockFile("file1.txt", "text/plain", 1024),
			},
			{
				id: "2",
				file: createMockFile(
					"file2.pdf",
					"application/pdf",
					1024 * 1024,
				),
			},
			{
				id: "3",
				file: createMockFile("file3.jpg", "image/jpeg", 1024 * 512),
			},
			{
				id: "4",
				file: createMockFile(
					"file4.docx",
					"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
					1024 * 1024 * 2,
				),
			},
			{
				id: "5",
				file: createMockFile(
					"file5.mp3",
					"audio/mpeg",
					1024 * 1024 * 5,
				),
			},
			{
				id: "6",
				file: createMockFile(
					"file6.zip",
					"application/zip",
					1024 * 1024 * 10,
				),
			},
		],
		onFilesChange: fn(),
		multiple: true,
		allowDirectories: true,
		disabled: false,
		label: "Bulk Upload",
		description: "Upload multiple files at once",
	},
}

export const LongFileNames: Story = {
	args: {
		files: [
			{
				id: "1",
				file: createMockFile(
					"this-is-a-very-long-filename-that-demonstrates-how-the-component-handles-extremely-long-file-names-that-might-cause-layout-issues.pdf",
					"application/pdf",
					1024 * 1024,
				),
			},
			{
				id: "2",
				file: createMockFile(
					"another-extremely-long-filename-with-many-words-and-hyphens-to-test-text-truncation-behavior.txt",
					"text/plain",
					1024,
				),
			},
		],
		onFilesChange: fn(),
		multiple: true,
		allowDirectories: true,
		disabled: false,
	},
}

export const AudioFiles: Story = {
	args: {
		files: [
			{
				id: "1",
				file: createMockFile(
					"song1.mp3",
					"audio/mpeg",
					1024 * 1024 * 4.2,
				),
			},
			{
				id: "2",
				file: createMockFile(
					"song2.wav",
					"audio/wav",
					1024 * 1024 * 25.6,
				),
			},
			{
				id: "3",
				file: createMockFile(
					"podcast.m4a",
					"audio/mp4",
					1024 * 1024 * 12.8,
				),
			},
		],
		onFilesChange: fn(),
		accept: "audio/*",
		multiple: true,
		allowDirectories: false,
		disabled: false,
		label: "Audio Upload",
		description: "Upload audio files for your collection",
	},
}

export const WithFilesAndError: Story = {
	args: {
		files: [
			{
				id: "1",
				file: createMockFile(
					"document.pdf",
					"application/pdf",
					1024 * 1024 * 2.5,
				),
			},
			{
				id: "2",
				file: createMockFile("image.jpg", "image/jpeg", 1024 * 512),
			},
			{
				id: "3",
				file: createMockFile(
					"spreadsheet.xlsx",
					"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
					1024 * 1024 * 1.2,
				),
			},
		],
		onFilesChange: fn(),
		multiple: true,
		allowDirectories: true,
		disabled: false,
		error: "Some files failed to upload. Please check your network connection and try again.",
	},
}

export const PreviewDisabled: Story = {
	args: {
		files: [
			{
				id: "1",
				file: createMockFile(
					"document.pdf",
					"application/pdf",
					1024 * 1024 * 2.5,
				),
			},
			{
				id: "2",
				file: createMockFile("image.jpg", "image/jpeg", 1024 * 512),
			},
			{
				id: "3",
				file: createMockFile(
					"spreadsheet.xlsx",
					"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
					1024 * 1024 * 1.2,
				),
			},
		],
		onFilesChange: fn(),
		multiple: true,
		allowDirectories: true,
		disabled: false,
		previewMode: AdvancedFileFieldPreviewMode.DISABLED,
		label: "File Upload - No Preview",
		description: "Files are uploaded but preview is disabled",
	},
}

export const PreviewEnabled: Story = {
	args: {
		files: [
			{
				id: "1",
				file: createMockFile(
					"document.pdf",
					"application/pdf",
					1024 * 1024 * 2.5,
				),
			},
			{
				id: "2",
				file: createMockFile("image.jpg", "image/jpeg", 1024 * 512),
			},
			{
				id: "3",
				file: createMockFile(
					"spreadsheet.xlsx",
					"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
					1024 * 1024 * 1.2,
				),
			},
		],
		onFilesChange: fn(),
		multiple: true,
		allowDirectories: true,
		disabled: false,
		previewMode: AdvancedFileFieldPreviewMode.ENABLED,
		label: "File Upload - Inline Preview",
		description: "Files are displayed inline below the upload area",
	},
}

export const PreviewModal: Story = {
	args: {
		files: [
			{
				id: "1",
				file: createMockFile(
					"document.pdf",
					"application/pdf",
					1024 * 1024 * 2.5,
				),
			},
			{
				id: "2",
				file: createMockFile("image.jpg", "image/jpeg", 1024 * 512),
			},
			{
				id: "3",
				file: createMockFile(
					"spreadsheet.xlsx",
					"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
					1024 * 1024 * 1.2,
				),
			},
			{
				id: "4",
				file: createMockFile(
					"presentation.pptx",
					"application/vnd.openxmlformats-officedocument.presentationml.presentation",
					1024 * 1024 * 5.8,
				),
			},
			{
				id: "5",
				file: createMockFile(
					"archive.zip",
					"application/zip",
					1024 * 1024 * 15.2,
				),
			},
		],
		onFilesChange: fn(),
		multiple: true,
		allowDirectories: true,
		disabled: false,
		previewMode: AdvancedFileFieldPreviewMode.MODAL,
		label: "File Upload - Modal Preview",
		description:
			"Files can be viewed and managed via modal dialog. Click 'Files' button to view.",
	},
}
