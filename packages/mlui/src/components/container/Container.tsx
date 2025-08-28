import {
	Container as MantineContainer,
	ContainerProps as MantineContainerProps,
} from "@mantine/core"
import { forwardRef } from "react"

export type ContainerProps = MantineContainerProps

/**
 * This container fixes Container from mantine, which fails to set data-strategy, which is required for styles to work there.
 */
export const Container = forwardRef<HTMLDivElement, ContainerProps>(
	(props, ref) => {
		const propsCopy = {
			...props,
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
