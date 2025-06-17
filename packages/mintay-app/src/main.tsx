import { MantineProvider, createTheme } from "@mantine/core"
import "@mantine/core/styles.css"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { AppBoundary } from "./app/boundary.tsx"
import { AppProvider } from "./app/provider.tsx"
import { Router } from "./router/router.tsx"

const theme = createTheme({
	// You can customize your theme here
})

createRoot(document.getElementById("root")!).render(
	<AppProvider>
		<StrictMode>
			<MantineProvider theme={theme}>
				<AppBoundary>
					<Router />
				</AppBoundary>
			</MantineProvider>
		</StrictMode>
	</AppProvider>,
)
