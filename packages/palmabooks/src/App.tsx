import {
	ErrorBoundary,
	MluiProvider,
	Router,
	RouterType,
} from "@teawithsand/mlui"
import { StrictMode } from "react"
import { AppBoundary } from "./app/app.boundary"
import { AppProvider } from "./app/app.provider"
import { AutonomousGlobalErrorFallback } from "./components/globalErrorFallback"
import { AppGlobalLayout } from "./components/layout"
import { RouterConfig } from "./router/routerConfig"

export const App = () => {
	return (
		<AppProvider>
			<StrictMode>
				<MluiProvider>
					<AppBoundary>
						<ErrorBoundary
							fallback={<AutonomousGlobalErrorFallback />}
						>
							<Router
								wrapperComponent={AppGlobalLayout}
								type={RouterType.BROWSER}
								routes={RouterConfig.routes}
								notFoundContent={RouterConfig.notFoundContent}
							/>
						</ErrorBoundary>
					</AppBoundary>
				</MluiProvider>
			</StrictMode>
		</AppProvider>
	)
}
