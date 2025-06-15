import { useAtomValue } from "@teawithsand/fstate"
import { useApp } from "../appHook"

export const useTransService = () => {
	return useApp().transService
}

export const useTransResolver = () => {
	return useAtomValue(useApp().transService.resolver)
}
