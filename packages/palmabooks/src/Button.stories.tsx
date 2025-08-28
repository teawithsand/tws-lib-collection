import { Button } from "@teawithsand/mlui"

export default {
	title: "Components/Button",
	component: Button,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: { type: "select" },
			options: [
				"filled",
				"light",
				"outline",
				"subtle",
				"default",
				"white",
				"gradient",
			],
		},
		size: {
			control: { type: "select" },
			options: ["xs", "sm", "md", "lg", "xl"],
		},
		color: {
			control: { type: "select" },
			options: [
				"blue",
				"red",
				"green",
				"yellow",
				"orange",
				"pink",
				"purple",
				"cyan",
				"gray",
			],
		},
		disabled: {
			control: { type: "boolean" },
		},
		loading: {
			control: { type: "boolean" },
		},
	},
}

export const Primary = {
	args: {
		children: "Primary Button",
		variant: "filled",
	},
}

export const Secondary = {
	args: {
		children: "Secondary Button",
		variant: "outline",
	},
}

export const Large = {
	args: {
		children: "Large Button",
		size: "lg",
	},
}

export const Small = {
	args: {
		children: "Small Button",
		size: "sm",
	},
}

export const Loading = {
	args: {
		children: "Loading Button",
		loading: true,
	},
}

export const Disabled = {
	args: {
		children: "Disabled Button",
		disabled: true,
	},
}
