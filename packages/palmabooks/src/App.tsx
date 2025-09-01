import { ErrorBoundary, Router, RouterType } from "@teawithsand/mlui"
import { StrictMode } from "react"
import { AppBoundary } from "./app/app.boundary"
import { AppProvider } from "./app/app.provider"
import { AutonomousGlobalErrorFallback } from "./components/globalErrorFallback"
import { AppGlobalLayout } from "./components/layout"
import { AppMluiProvider } from "./components/util/appMluiProvider"
import { RouterConfig } from "./router/routerConfig"
import { ThemeProvider } from "./utils/theme/themeContext"

export const App = () => {
	return (
		<ThemeProvider>
			<AppProvider>
				<StrictMode>
					<AppMluiProvider>
						<AppBoundary>
							<ErrorBoundary
								fallback={<AutonomousGlobalErrorFallback />}
							>
								<Router
									wrapperComponent={AppGlobalLayout}
									type={RouterType.BROWSER}
									routes={RouterConfig.routes}
									notFoundContent={
										RouterConfig.notFoundContent
									}
								/>
							</ErrorBoundary>
						</AppBoundary>
					</AppMluiProvider>
				</StrictMode>
			</AppProvider>
		</ThemeProvider>
	)
}
