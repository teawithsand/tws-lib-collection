import type { Meta, StoryObj } from "@storybook/react"
import { Container } from "@teawithsand/mlui"
import { fn } from "storybook/test"
import { StoragePageContent } from "./StoragePageContent"

const createMockStorageEstimate = (
	usagePercent = 0.3,
	quota = 10_000_000_000,
) => ({
	quota,
	usage: quota * usagePercent,
})

const meta: Meta<typeof StoragePageContent> = {
	title: "Components/PageContent/Storage/StoragePageContent",
	component: StoragePageContent,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"A non-autonomous component for displaying storage information and persistence controls. Takes storage data and callbacks as props, making it suitable for Storybook and testing.",
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
		storageEstimate: {
			control: "object",
			description: "Storage quota and usage information",
		},
		isStoragePersisted: {
			control: "boolean",
			description: "Whether storage is currently persisted",
		},
		onRefreshStorage: {
			description: "Callback to refresh storage estimate",
		},
		onRefreshPage: {
			description: "Callback to refresh the entire page",
		},
		onRequestPersistence: {
			description: "Callback to request storage persistence",
		},
	},
}

export default meta
type Story = StoryObj<typeof StoragePageContent>

export const Default: Story = {
	args: {
		storageEstimate: createMockStorageEstimate(0.3),
		isStoragePersisted: false,
		onRefreshStorage: fn(),
		onRefreshPage: fn(),
		onRequestPersistence: fn(),
	},
}

export const LowUsage: Story = {
	args: {
		storageEstimate: createMockStorageEstimate(0.05),
		isStoragePersisted: false,
		onRefreshStorage: fn(),
		onRefreshPage: fn(),
		onRequestPersistence: fn(),
	},
}

export const HighUsage: Story = {
	args: {
		storageEstimate: createMockStorageEstimate(0.85),
		isStoragePersisted: false,
		onRefreshStorage: fn(),
		onRefreshPage: fn(),
		onRequestPersistence: fn(),
	},
}

export const NearFullUsage: Story = {
	args: {
		storageEstimate: createMockStorageEstimate(0.95),
		isStoragePersisted: false,
		onRefreshStorage: fn(),
		onRefreshPage: fn(),
		onRequestPersistence: fn(),
	},
}

export const StoragePersisted: Story = {
	args: {
		storageEstimate: createMockStorageEstimate(0.4),
		isStoragePersisted: true,
		onRefreshStorage: fn(),
		onRefreshPage: fn(),
		onRequestPersistence: fn(),
	},
}

export const StoragePersistedHighUsage: Story = {
	args: {
		storageEstimate: createMockStorageEstimate(0.8),
		isStoragePersisted: true,
		onRefreshStorage: fn(),
		onRefreshPage: fn(),
		onRequestPersistence: fn(),
	},
}

export const SmallQuota: Story = {
	args: {
		storageEstimate: createMockStorageEstimate(0.6, 1_000_000_000), // 1GB quota
		isStoragePersisted: false,
		onRefreshStorage: fn(),
		onRefreshPage: fn(),
		onRequestPersistence: fn(),
	},
}

export const LargeQuota: Story = {
	args: {
		storageEstimate: createMockStorageEstimate(0.2, 100_000_000_000), // 100GB quota
		isStoragePersisted: true,
		onRefreshStorage: fn(),
		onRefreshPage: fn(),
		onRequestPersistence: fn(),
	},
}

export const InteractiveExample: Story = {
	args: {
		storageEstimate: createMockStorageEstimate(0.45),
		isStoragePersisted: false,
		onRefreshStorage: fn(),
		onRefreshPage: () => {
			// Simulate page refresh in Storybook
			alert("Page would refresh in a real application")
		},
		onRequestPersistence: async () => {
			// Simulate async persistence request
			await new Promise((resolve) => setTimeout(resolve, 1000))

			// Simulate occasional rejection for testing
			if (Math.random() < 0.3) {
				throw new Error("Persistence request rejected by browser")
			}
		},
	},
}
