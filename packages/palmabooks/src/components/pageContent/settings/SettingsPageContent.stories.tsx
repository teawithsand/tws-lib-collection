import type { Meta, StoryObj } from "@storybook/react"
import { Container } from "@teawithsand/mlui"
import { fn } from "storybook/test"
import { SettingsPageContent } from "./SettingsPageContent"

const meta: Meta<typeof SettingsPageContent> = {
	title: "Components/PageContent/Settings/SettingsPageContent",
	component: SettingsPageContent,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"A non-autonomous component for displaying the settings page. Provides theme selection and other configuration options with proper mobile-responsive design.",
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
		theme: {
			control: "select",
			options: ["light", "dark", "auto"],
			description: "Current theme setting",
		},
		onThemeChange: {
			description: "Callback when theme is changed",
		},
	},
}

export default meta
type Story = StoryObj<typeof SettingsPageContent>

export const Default: Story = {
	args: {
		theme: "auto",
		onThemeChange: fn(),
	},
}

export const LightTheme: Story = {
	args: {
		theme: "light",
		onThemeChange: fn(),
	},
}

export const DarkTheme: Story = {
	args: {
		theme: "dark",
		onThemeChange: fn(),
	},
}

export const Interactive: Story = {
	args: {
		theme: "auto",
		onThemeChange: fn(),
	},
}

export const MobileView: Story = {
	args: {
		theme: "auto",
		onThemeChange: fn(),
	},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
	},
}

export const TabletView: Story = {
	args: {
		theme: "dark",
		onThemeChange: fn(),
	},
	parameters: {
		viewport: {
			defaultViewport: "tablet",
		},
	},
}
