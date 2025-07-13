import { ReactNode } from "react"

export const IfBoundary = (props: {
	condition: boolean
	children?: ReactNode
	fallback?: ReactNode
}) => {
	return props.condition ? <>{props.children}</> : <>{props.fallback}</>
}
