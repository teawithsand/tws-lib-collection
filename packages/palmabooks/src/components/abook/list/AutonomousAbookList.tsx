import { useApp } from "@/app/app.hooks"
import { AbookList } from "./AbookList"

export const AutonomousAbookList = () => {
	const { abookStoreService } = useApp()
	return <AbookList abooksAtom={abookStoreService.abooksList} />
}
