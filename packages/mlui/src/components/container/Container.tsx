import {
	Container as MantineContainer,
	ContainerProps as MantineContainerProps,
} from "@mantine/core"
import { forwardRef } from "react"

export interface ContainerProps extends MantineContainerProps {
	readonly fullWidth?: boolean
}

/**
 * This container fixes Container from mantine, which fails to set data-strategy, which is required for styles to work there.
 */
export const Container = forwardRef<HTMLDivElement, ContainerProps>(
	(props, ref) => {
		const { fullWidth, style, ...rest } = props

		const propsCopy = {
			...rest,
			style: fullWidth ? { width: "100%", ...style } : style,
		}

		if ("strategy" in propsCopy) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			;(propsCopy as any)["data-strategy"] = propsCopy["strategy"]
		} else {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			;(propsCopy as any)["data-strategy"] = "block"
		}

		return <MantineContainer ref={ref} {...propsCopy} />
	},
)

Container.displayName = "MluiContainer"
