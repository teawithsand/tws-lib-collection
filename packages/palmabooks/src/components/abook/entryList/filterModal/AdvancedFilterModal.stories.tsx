import type { Meta, StoryObj } from "@storybook/react"
import { AbookEntryDisposition } from "@teawithsand/booklibr"
import { Container } from "@teawithsand/mlui"
import { fn } from "storybook/test"
import { AbookEntryFilterState } from "../common"
import { AdvancedFilterModal } from "./AdvancedFilterModal"

const meta: Meta<typeof AdvancedFilterModal> = {
	title: "Components/Abook/EntryList/FilterModal/AdvancedFilterModal",
	component: AdvancedFilterModal,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"A modal component for advanced filtering of audiobook entries. Provides search and disposition filtering options with clear and apply actions.",
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
		opened: {
			control: "boolean",
			description: "Controls whether the modal is visible",
		},
		filterState: {
			control: "object",
			description:
				"Current filter state with search text and disposition filter",
		},
		onClose: {
			description: "Callback function called when modal is closed",
		},
		onFilterChange: {
			description: "Callback function called when filter state changes",
		},
	},
}

export default meta
type Story = StoryObj<typeof AdvancedFilterModal>

const defaultFilterState: AbookEntryFilterState = {
	searchText: "",
	dispositionFilter: undefined,
}

export const Default: Story = {
	args: {
		opened: true,
		filterState: defaultFilterState,
		onClose: fn(),
		onFilterChange: fn(),
	},
}

export const WithSearchFilter: Story = {
	args: {
		opened: true,
		filterState: {
			searchText: "chapter",
			dispositionFilter: undefined,
		},
		onClose: fn(),
		onFilterChange: fn(),
	},
}

export const WithDispositionFilter: Story = {
	args: {
		opened: true,
		filterState: {
			searchText: "",
			dispositionFilter: AbookEntryDisposition.PLAYABLE_AUDIO,
		},
		onClose: fn(),
		onFilterChange: fn(),
	},
}

export const WithBothFilters: Story = {
	args: {
		opened: true,
		filterState: {
			searchText: "intro",
			dispositionFilter: AbookEntryDisposition.PLAYABLE_AUDIO,
		},
		onClose: fn(),
		onFilterChange: fn(),
	},
}

export const SmallResultSet: Story = {
	args: {
		opened: true,
		filterState: {
			searchText: "very specific search",
			dispositionFilter: AbookEntryDisposition.COVER_IMAGE,
		},
		onClose: fn(),
		onFilterChange: fn(),
	},
}

export const NoResults: Story = {
	args: {
		opened: true,
		filterState: {
			searchText: "nonexistent file",
			dispositionFilter: undefined,
		},
		onClose: fn(),
		onFilterChange: fn(),
	},
}

export const Closed: Story = {
	args: {
		opened: false,
		filterState: defaultFilterState,
		onClose: fn(),
		onFilterChange: fn(),
	},
}
