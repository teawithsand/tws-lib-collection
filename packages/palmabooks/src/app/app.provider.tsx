import { Provider } from "@teawithsand/fstate"
import { ReactNode, useEffect, useState } from "react"
import { LIB_LOGGER } from "../internal/log"
import { App } from "./app"
import { AppDi, DiConfig } from "./app.di"
import { AppContext } from "./app.hooks"

const LOG_TAG = "AppProvider"
const logger = LIB_LOGGER.createTaggedLogger(LOG_TAG)

export interface AppProviderProps {
	children: ReactNode
	config?: DiConfig
}

export const AppProvider = ({ children, config }: AppProviderProps) => {
	const [app, setApp] = useState<App | null>(null)
	const [error, setError] = useState<Error | null>(null)

	useEffect(() => {
		const initializeApp = async () => {
			try {
				const appConfig = config || AppDi.DI_PROD_CONFIG
				const diBuilder = AppDi.makeDiBuilder(appConfig)
				const di = await diBuilder.build()
				const appInstance = new App(di)

				setApp(appInstance)
			} catch (initError) {
				const error =
					initError instanceof Error
						? initError
						: new Error(String(initError))
				logger.error("Failed to initialize app", error)
				setError(error)
			}
		}

		initializeApp()
	}, [config])

	useEffect(() => {
		// Cleanup effect to release app on unmount
		return () => {
			if (app) {
				app.release().catch((releaseError) => {
					const error =
						releaseError instanceof Error
							? releaseError
							: new Error(String(releaseError))
					logger.warn("Error occurred while releasing app", error)
				})
			}
		}
	}, [app])

	if (error) {
		throw error
	}

	return (
		<AppContext.Provider value={app}>
			<Provider store={app?.atomStore}>{children}</Provider>
		</AppContext.Provider>
	)
}
