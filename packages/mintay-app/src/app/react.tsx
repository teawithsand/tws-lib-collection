import { inPlace } from "@teawithsand/lngext"
import { ReactNode, useEffect, useState } from "react"
import { App } from "./app"
import { AppContext } from "./appHook"
import { AppDi } from "./di"

export const AppProvider = ({ children }: { children?: ReactNode }) => {
	const [app, setApp] = useState<App | null>(null)

	useEffect(() => {
		inPlace(async () => {
			const diBuilder = AppDi.makeDiBuilder(AppDi.DI_PROD_CONFIG)
			setApp(new App(await diBuilder.build()))
		})
	}, [])

	return <AppContext.Provider value={app}>{children}</AppContext.Provider>
}
