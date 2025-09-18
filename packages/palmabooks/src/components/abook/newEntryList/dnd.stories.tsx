import type { Meta, StoryObj } from "@storybook/react"
import { SortableListExample } from "./dnd"

const meta: Meta<typeof SortableListExample> = {
	title: "Components/SortableListExample",
	component: SortableListExample,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
