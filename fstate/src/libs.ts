import { enableMapSet, setAutoFreeze, setUseStrictShallowCopy } from "immer"
import { createStore } from "jotai"

export { createStore } from "jotai"

export * from "immer"
export * from "jotai"
export * from "jotai-devtools"
export * from "jotai-effect"
export * from "jotai-immer"
export * from "jotai/utils"

export type JotaiStore = ReturnType<typeof createStore>

enableMapSet()
setAutoFreeze(true)
setUseStrictShallowCopy("class_only")
