import "@mantine/core/styles.css"
import "@teawithsand/mlui/dist/index.css"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<div>Heck world!</div>
	</StrictMode>,
)
