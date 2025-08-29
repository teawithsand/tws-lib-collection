import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "storybook/test"
import { AbookUploadForm } from "./abookUploadForm"

const meta: Meta<typeof AbookUploadForm> = {
	title: "Components/Abook/Form/Upload",
	component: AbookUploadForm,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"A form component for uploading audio files to audiobooks. Supports multiple files, directories, and validation.",
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
		disabled: {
			control: "boolean",
		},
		submitButtonText: {
			control: "text",
		},
		error: {
			control: "text",
		},
	},
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	args: {
		onSubmit: fn(),
		disabled: false,
	},
}

export const WithCustomButtonText: Story = {
	args: {
		onSubmit: fn(),
		disabled: false,
		submitButtonText: "Upload Audio Files",
	},
}

export const Disabled: Story = {
	args: {
		onSubmit: fn(),
		disabled: true,
	},
}

export const WithError: Story = {
	args: {
		onSubmit: fn(),
		disabled: false,
		error: "Failed to upload files. Please try again.",
	},
}

export const WithInitialFiles: Story = {
	args: {
		onSubmit: fn(),
		disabled: false,
		initialData: {
			files: [
				{
					id: "1",
					file: new File([""], "example.mp3", { type: "audio/mpeg" }),
				},
				{
					id: "2",
					file: new File([""], "chapter-01.mp3", {
						type: "audio/mpeg",
					}),
				},
			],
		},
	},
}

export const LongSubmit: Story = {
	args: {
		onSubmit: () => new Promise((resolve) => setTimeout(resolve, 3000)),
		disabled: false,
		initialData: {
			files: [
				{
					id: "1",
					file: new File([""], "example.mp3", { type: "audio/mpeg" }),
				},
			],
		},
	},
}
