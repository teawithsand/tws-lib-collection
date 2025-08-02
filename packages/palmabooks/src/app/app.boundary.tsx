import { LoadingFallback } from "@teawithsand/mlui"
import { ReactNode } from "react"
import { useAppOptional } from "./app.hooks"

export interface AppBoundaryProps {
	children: ReactNode
	fallback?: ReactNode
}

export const AppBoundary = ({ children, fallback }: AppBoundaryProps) => {
	const app = useAppOptional()

	if (!app) {
		return <>{fallback ?? <LoadingFallback />}</>
	}

	return <>{children}</>
}
