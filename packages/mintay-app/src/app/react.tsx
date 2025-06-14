import { inPlace } from "@teawithsand/lngext"
import { ReactNode, useEffect, useState } from "react"
import { App } from "./app"
import { AppContext } from "./appHook"
import { makeAppDi } from "./di"

export const AppProvider = ({ children }: { children?: ReactNode }) => {
	const [app, setApp] = useState<App | null>(null)

	useEffect(() => {
		inPlace(async () => {
			setApp(new App(await makeAppDi()))
		})
	}, [])

	return <AppContext.Provider value={app}>{children}</AppContext.Provider>
}
