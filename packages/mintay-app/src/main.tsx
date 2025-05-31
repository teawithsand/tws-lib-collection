import { MantineProvider, createTheme } from "@mantine/core"
import "@mantine/core/styles.css"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App.tsx"

const theme = createTheme({
	// You can customize your theme here
})

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<MantineProvider theme={theme}>
			<App />
		</MantineProvider>
	</StrictMode>,
)
