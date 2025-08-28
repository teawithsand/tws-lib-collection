import { Button, type ButtonProps } from "@mantine/core"
import { type MouseEvent, type ReactNode } from "react"

import { Link } from "../routing/router/link"

type BaseLinkButtonProps = Omit<ButtonProps, "onClick" | "component"> & {
	readonly children: ReactNode
}

type LinkButtonWithStringOnClick = BaseLinkButtonProps & {
	readonly onClick: string
	readonly replace?: boolean
	readonly state?: unknown
}

type LinkButtonWithFunctionOnClick = BaseLinkButtonProps & {
	readonly onClick?: (event: MouseEvent<HTMLButtonElement>) => void
}

export type LinkButtonOnClick =
	| ((event: MouseEvent<HTMLButtonElement>) => void)
	| string

export type LinkButtonProps =
	| LinkButtonWithStringOnClick
	| LinkButtonWithFunctionOnClick

export const LinkButton = (props: LinkButtonProps) => {
	const { onClick, children, ...buttonProps } = props

	if (typeof onClick === "string") {
		const { replace, state, ...restProps } =
			props as LinkButtonWithStringOnClick
		return (
			<Button
				{...restProps}
				component={Link}
				to={onClick}
				replace={replace}
				state={state}
			>
				{children}
			</Button>
		)
	}

	return (
		<Button {...buttonProps} onClick={onClick}>
			{children}
		</Button>
	)
}
