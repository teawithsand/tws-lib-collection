import "./_mantine.scss"
import "./_styles.scss"

export * from "./appBar"
export * from "./components"
export * from "./domain"
export * from "./misc"
export * from "./reactUtils"

// reexports from other libraries
// For some reason, rollup prefers putting all export in this index.ts root file
// otherwise if they are defined in some other file, it generates only definitions there
// but puts reexports here nonetheless, which generates build time warnings about double reexporting of some types
export * from "@mantine/core"
export * from "@mantine/hooks"
export * from "@mantine/notifications"
export * from "@tabler/icons-react"

// Override components exported with export * above.
export { Container, type ContainerProps } from "./components/container"
