import { BaseError, Errors, throwError } from "@teawithsand/lngext"
import { Context, createContext, useContext } from "react"

export const ContextNotDefinedError = Errors.makeErrorType(
	"ContextNotDefinedError",
	BaseError,
)

export class ReactContextUtil {
	private constructor() {}

	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	public static readonly simpleContext = <T extends {}>(
		debugContextName: string = "",
	) => {
		const { context, useValueOrThrow, useValueNullable } =
			ReactContextUtil.simpleContextObject<T>(debugContextName)

		return [context, useValueOrThrow, useValueNullable] as [
			Context<T | null>,
			() => T,
			() => T | null,
		]
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	public static readonly simpleContextObject = <T extends {}>(
		debugContextName: string = "",
	) => {
		const context = createContext<T | null>(null)

		return {
			context,
			useValueOrThrow: () => {
				return (
					useContext(context) ??
					throwError(
						new ContextNotDefinedError(
							`Context value for context: "${debugContextName || "[No name provided]"}" was not provided`,
						),
					)
				)
			},
			useValueNullable: () => useContext(context),
		}
	}
}
