import { TypeAssert } from "@teawithsand/lngext"
import { type CSSProperties, type ReactNode } from "react"
import styles from "./appLocalLayout.module.scss"
import { AppLocalLayoutVariant } from "./appLocalLayoutVariant"

export interface AppLocalLayoutProps {
	readonly children: ReactNode
	readonly className?: string
	readonly style?: CSSProperties
	readonly variant?: AppLocalLayoutVariant
}

/**
 * Local layout component that wraps each page separately
 */
export const AppLocalLayout = ({
	children,
	className,
	style,
	variant = AppLocalLayoutVariant.DEFAULT,
}: AppLocalLayoutProps) => {
	if (variant === AppLocalLayoutVariant.EMPTY) {
		return <>{children}</>
	} else if (variant === AppLocalLayoutVariant.SIMPLE) {
		return (
			<div className={className} style={style}>
				{children}
			</div>
		)
	} else if (variant === AppLocalLayoutVariant.FULL) {
		return <>{children}</>
	} else if (variant === AppLocalLayoutVariant.DEFAULT) {
		return (
			<div
				className={`${styles.container}${className ? ` ${className}` : ""}`}
				style={style}
			>
				{children}
			</div>
		)
	} else {
		TypeAssert.unreachable(`Unknown AppLocalLayoutVariant: ${variant}`)
	}
}
