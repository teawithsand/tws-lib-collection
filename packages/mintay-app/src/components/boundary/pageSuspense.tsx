import { ReactNode } from "react"
import { AppSuspense } from "./appSuspense"

interface PageSuspenseProps {
	children: ReactNode
}

export const PageSuspense = ({ children }: PageSuspenseProps) => {
	return <AppSuspense>{children}</AppSuspense>
}
