import { LibraryBaseLogger, LoggerImpl } from "@teawithsand/llog"

export const MLUI_LOGGER = new LoggerImpl(
	LibraryBaseLogger.getLibraryLogger("@teawithsand/mlui"),
)
