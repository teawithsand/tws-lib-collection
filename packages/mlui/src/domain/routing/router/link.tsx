import { Link as ReactRouterLink } from "react-router"
import { type LinkProps } from "../defines"

/**
 * Link component implementation using react-router
 */
export const Link = ({
	to,
	children,
	className,
	replace,
	state,
}: LinkProps) => {
	return (
		<ReactRouterLink
			to={to}
			className={className}
			replace={replace}
			state={state}
		>
			{children}
		</ReactRouterLink>
	)
}
