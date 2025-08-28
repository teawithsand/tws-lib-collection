import type { Meta, StoryObj } from "@storybook/react"
import { AbookData } from "@teawithsand/booklibr"
import { AbookCreateForm } from "./abookCreateForm"

const meta: Meta<typeof AbookCreateForm> = {
	title: "Components/Abook/Form/AbookCreateForm",
	component: AbookCreateForm,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component:
					"A form component for creating new audiobooks. Includes validation for title, description, and private notes.",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		initialData: {
			control: "object",
			description: "Initial form data to populate the fields",
		},
		onSubmit: {
			description:
				"Callback function called when form is submitted successfully",
		},
	},
}

export default meta
type Story = StoryObj<typeof AbookCreateForm>

// Default story
export const Default: Story = {
	args: {
		onSubmit: async (data: AbookData) => {
			// Form submitted - data would be processed here
			void data
		},
	},
}

// Story with initial data
export const WithInitialData: Story = {
	args: {
		initialData: {
			title: "Sample Book Title",
			description: "This is a sample description for the audiobook.",
			privateUserNote: "Personal notes about this book",
		},
		onSubmit: async (data: AbookData) => {
			// Form submitted with initial data - data would be processed here
			void data
		},
	},
}

// Story with partial initial data
export const WithPartialData: Story = {
	args: {
		initialData: {
			title: "The Great Gatsby",
		},
		onSubmit: async (data: AbookData) => {
			// Form submitted with partial data - data would be processed here
			void data
		},
	},
}

// Story that simulates form submission
export const WithAsyncSubmission: Story = {
	args: {
		onSubmit: async (data: AbookData) => {
			// Form submitted - async simulation
			void data
			// Simulate async operation
			return new Promise((resolve) => {
				setTimeout(resolve, 2000)
			})
		},
	},
}

// Story that simulates submission error
export const WithSubmissionError: Story = {
	args: {
		onSubmit: async (data: AbookData) => {
			// Form submitted - will error
			void data
			// Simulate error after delay
			return new Promise((_, reject) => {
				setTimeout(() => {
					reject(new Error("Failed to create audiobook"))
				}, 1000)
			})
		},
	},
}

// Story with long content to test validation
export const WithLongContent: Story = {
	args: {
		initialData: {
			title: "A".repeat(250), // Exceeds 200 character limit
			description: "B".repeat(2100), // Exceeds 2000 character limit
			privateUserNote: "C".repeat(1100), // Exceeds 1000 character limit
		},
		onSubmit: async (data: AbookData) => {
			// Form submitted with long content - data would be processed here
			void data
		},
	},
}

// Story with empty title to show validation
export const WithEmptyTitle: Story = {
	args: {
		initialData: {
			title: "",
			description: "This book has no title set",
			privateUserNote: "Need to add a title",
		},
		onSubmit: async (data: AbookData) => {
			// Form submitted with empty title - data would be processed here
			void data
		},
	},
}
