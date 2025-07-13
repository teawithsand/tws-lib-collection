import { inPlace } from "@teawithsand/lngext"
import { createContext, ReactNode, useEffect, useState } from "react"
import { MLUI_LOGGER } from "../../internal/log"

export interface AppBase {
	readonly release: () => Promise<void>
}

const Logger = MLUI_LOGGER.createTaggedLogger("AppProvider")

export const AppProvider = <T extends AppBase>({
	context: Context,
	appFactory,
	children,
}: {
	context: ReturnType<typeof createContext<T | null>>
	appFactory: () => Promise<T>
	children?: ReactNode
}) => {
	const [app, setApp] = useState<T | null>(null)

	useEffect(() => {
		let isValid = true
		const promise = inPlace(async () => {
			const app = await appFactory()

			if (isValid) {
				setApp(app)
			}

			return app
		})

		return () => {
			isValid = false
			promise
				.then((app) => app.release())
				.catch((err) => {
					Logger.warn("App release has thrown", err)
				})
		}
	}, [appFactory])

	return <Context.Provider value={app}>{children}</Context.Provider>
}
