import type { Meta, StoryObj } from "@storybook/react"
import { Container } from "@teawithsand/mlui"
import { expect, fn, userEvent, within } from "storybook/test"
import { SettingsThemeSection } from "./SettingsThemeSection"

const meta: Meta<typeof SettingsThemeSection> = {
	title: "Components/PageContent/Settings/Parts/SettingsThemeSection",
	component: SettingsThemeSection,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"A settings section component for theme selection. Provides a dropdown to choose between light, dark, and auto (system) themes with responsive design for mobile and desktop.",
			},
		},
	},
	decorators: [
		(Story) => (
			<Container py="md" size="md">
				<Story />
			</Container>
		),
	],
	tags: ["autodocs"],
	argTypes: {
		value: {
			control: "select",
			options: ["light", "dark", "auto"],
			description: "Current theme value",
		},
		onChange: {
			description: "Callback when theme selection changes",
		},
	},
}

export default meta
type Story = StoryObj<typeof SettingsThemeSection>

export const Auto: Story = {
	args: {
		value: "auto",
		onChange: fn(),
	},
}

export const Light: Story = {
	args: {
		value: "light",
		onChange: fn(),
	},
}

export const Dark: Story = {
	args: {
		value: "dark",
		onChange: fn(),
	},
}

export const MobileView: Story = {
	args: {
		value: "auto",
		onChange: fn(),
	},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
	},
}

export const TabletView: Story = {
	args: {
		value: "dark",
		onChange: fn(),
	},
	parameters: {
		viewport: {
			defaultViewport: "tablet",
		},
	},
}

export const Interactive: Story = {
	args: {
		value: "auto",
		onChange: fn(),
	},
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement)
		const select = canvas.getByRole("combobox")

		// Check initial value
		expect(select).toHaveValue("auto")

		// Change to light theme
		await userEvent.selectOptions(select, "light")
		expect(args.onChange).toHaveBeenCalledWith("light")

		// Change to dark theme
		await userEvent.selectOptions(select, "dark")
		expect(args.onChange).toHaveBeenCalledWith("dark")

		// Change back to auto
		await userEvent.selectOptions(select, "auto")
		expect(args.onChange).toHaveBeenCalledWith("auto")
	},
}
