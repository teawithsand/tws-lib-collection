import { PalmabooksError } from "@/utils/error"
import { useAtomValue } from "@teawithsand/fstate"
import { createContext, useContext } from "react"
import { App } from "./app"

export const AppContext = createContext<App | null>(null)

export const useApp = () => {
	const app = useAppOptional()
	if (!app) {
		throw new PalmabooksError("App context is not available")
	}
	return app
}

export const useAppOptional = () => useContext(AppContext)

export const useTransResolver = () => {
	const app = useApp()
	return useAtomValue(app.translationService.resolver)
}
