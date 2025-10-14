import type { Meta, StoryObj } from "@storybook/react"
import { Container } from "@teawithsand/mlui"
import { expect, userEvent, within } from "storybook/test"
import { AbookAddFilesWizard } from "./AbookAddFilesWizard"

const createMockFile = (name: string, type = "application/epub+zip") => {
	return new File(["Storybook sample"], name, { type })
}

const ensureDropzoneReady = async (canvasElement: HTMLElement) => {
	const canvas = within(canvasElement)
	await canvas.findByText("Drag&Drop files here")

	const input = canvasElement.querySelector(
		'input[type="file"]',
	) as HTMLInputElement | null
	if (!input) {
		throw new Error("Dropzone file input not found")
	}

	return input
}

const meta: Meta<typeof AbookAddFilesWizard> = {
	title: "Components/Abook/AddFiles/AbookAddFilesWizard",
	component: AbookAddFilesWizard,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"A multi-step wizard for adding new audio book files. Demonstrates file picking, validation, and upload preparation within Storybook.",
			},
		},
	},
	decorators: [
		(Story) => (
			<Container size="lg" py="xl">
				<Story />
			</Container>
		),
	],
	tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof AbookAddFilesWizard>

export const Default: Story = {}

export const FilesSelected: Story = {
	parameters: {
		docs: {
			description: {
				story: "Shows the wizard after selecting multiple files. Storybook simulates a file upload by programmatically adding files to the dropzone.",
			},
		},
	},
	play: async ({ canvasElement }) => {
		const input = await ensureDropzoneReady(canvasElement)
		await userEvent.upload(input, [
			createMockFile("chapter-01.mp3", "audio/mpeg"),
			createMockFile("chapter-02.mp3", "audio/mpeg"),
		])

		const canvas = within(canvasElement)
		expect(await canvas.findByText("Files (2)")).toBeInTheDocument()
	},
}

export const UploadReady: Story = {
	parameters: {
		docs: {
			description: {
				story: "Illustrates the upload step after reviewing files. The interaction drops files and proceeds to the upload confirmation tab.",
			},
		},
	},
	play: async ({ canvasElement }) => {
		const input = await ensureDropzoneReady(canvasElement)
		await userEvent.upload(input, [
			createMockFile("chapter-01.mp3", "audio/mpeg"),
			createMockFile("chapter-02.mp3", "audio/mpeg"),
		])

		const canvas = within(canvasElement)
		const continueButton = await canvas.findByRole("button", {
			name: "Continue",
		})
		await userEvent.click(continueButton)

		expect(
			await canvas.findByText("Do you want to add files to the ABook?"),
		).toBeInTheDocument()
	},
}

export const DuplicateNames: Story = {
	parameters: {
		docs: {
			description: {
				story: "Highlights validation feedback when multiple files with the same name are added in a single batch.",
			},
		},
	},
	play: async ({ canvasElement }) => {
		const input = await ensureDropzoneReady(canvasElement)
		await userEvent.upload(input, [
			createMockFile("duplicate.mp3", "audio/mpeg"),
			createMockFile("duplicate.mp3", "audio/mpeg"),
		])

		const canvas = within(canvasElement)
		expect(
			await canvas.findByText("Duplicate name in selection"),
		).toBeInTheDocument()
	},
}
