import { LibraryBaseLogger, LoggerImpl } from "@teawithsand/llog"

export const LIB_LOGGER = new LoggerImpl(
	LibraryBaseLogger.getLibraryLogger("@teawithsand/palmabooks"),
)
