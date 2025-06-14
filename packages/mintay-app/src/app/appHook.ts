import { createContext, useContext } from "react"
import { App } from "./app"

export const AppContext = createContext<App | null>(null)

export const useApp = () => {
	const app = useAppOptional()
	if (!app) {
		throw new Error("App context is not available")
	}
	return app
}

export const useAppOptional = () => useContext(AppContext)
