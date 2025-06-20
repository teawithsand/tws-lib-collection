import { Provider } from "@teawithsand/fstate"
import { inPlace } from "@teawithsand/lngext"
import { ReactNode, useEffect, useState } from "react"
import { App } from "./app"
import { AppContext } from "./appHook"
import { AppDi } from "./di"

export const AppProvider = ({ children }: { children?: ReactNode }) => {
	const [app, setApp] = useState<App | null>(null)

	useEffect(() => {
		const promise = inPlace(async () => {
			const diBuilder = AppDi.makeDiBuilder(AppDi.DI_PROD_CONFIG)
			const app = new App(await diBuilder.build())
			setApp(app)

			return app
		})

		return () => {
			promise.then((app) => {
				app.release()
			})
		}
	}, [])

	return (
		<AppContext.Provider value={app}>
			<Provider store={app?.atomStore}>{children}</Provider>
		</AppContext.Provider>
	)
}
