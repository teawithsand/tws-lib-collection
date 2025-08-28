import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "storybook/test"
import { GlobalErrorFallback } from "./globalErrorFallback"

const meta: Meta<typeof GlobalErrorFallback> = {
	title: "Components/GlobalErrorFallback",
	component: GlobalErrorFallback,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"Global error fallback component that displays when an unhandled error occurs. Provides users with error information and ability to refresh the page.",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		error: {
			control: false,
			description: "The error object that caused the component to render",
		},
		resetErrorBoundary: {
			description: "Callback function to reset the error boundary",
		},
	},
}

export default meta
type Story = StoryObj<typeof GlobalErrorFallback>

export const Default: Story = {
	args: {
		error: new Error("Something went wrong"),
		resetErrorBoundary: fn(),
	},
}

export const NetworkError: Story = {
	args: {
		error: new Error("Network request failed: Unable to connect to server"),
		resetErrorBoundary: fn(),
	},
}

export const ValidationError: Story = {
	args: {
		error: new Error(
			"Validation failed: The provided data does not match the expected format",
		),
		resetErrorBoundary: fn(),
	},
}

export const LongErrorMessage: Story = {
	args: {
		error: new Error(
			"This is a very long error message that demonstrates how the component handles extensive error descriptions. It includes multiple sentences and technical details that might occur in a real application. The error could be related to database connections, API failures, authentication issues, or complex validation problems that require detailed explanations for developers to understand and debug the underlying issue.",
		),
		resetErrorBoundary: fn(),
	},
}

export const JavaScriptError: Story = {
	args: {
		error: new TypeError("Cannot read property 'foo' of undefined"),
		resetErrorBoundary: fn(),
	},
}

export const EmptyErrorMessage: Story = {
	args: {
		error: new Error(""),
		resetErrorBoundary: fn(),
	},
}

export const ChunkLoadError: Story = {
	args: {
		error: new Error("Loading CSS chunk 1234 failed."),
		resetErrorBoundary: fn(),
	},
}

export const AuthenticationError: Story = {
	args: {
		error: new Error("Authentication failed: Invalid credentials"),
		resetErrorBoundary: fn(),
	},
}

export const DatabaseError: Story = {
	args: {
		error: new Error(
			"Database connection timeout: Unable to establish connection within 30 seconds",
		),
		resetErrorBoundary: fn(),
	},
}

export const ParseError: Story = {
	args: {
		error: new SyntaxError("Unexpected token < in JSON at position 0"),
		resetErrorBoundary: fn(),
	},
}
