import "@mantine/core/styles.css"
import { createRoot } from "react-dom/client"
import { AppBarDemoApp } from "./internalDemo/appBarDemoApp"

const rootElement = document.getElementById("root")
const root = createRoot(rootElement!)
root.render(<AppBarDemoApp />)
