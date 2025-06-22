import { LibraryBaseLogger, LoggerImpl } from "@teawithsand/llog"

export const libraryLogger = new LoggerImpl(
	new LibraryBaseLogger("@teawithsand/sandbox"),
)
