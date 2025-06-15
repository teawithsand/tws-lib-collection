/**
 * Base type of TransString, which is a function of translation that returns some string.
 */
export type TransStringFn<T> = (translations: T) => string

/**
 * Some string, presumably with some parameters, that can be translated.
 *
 * It's already parametrized and ready to be resolved.
 */
export type TransString<T> = TransStringFn<T>

export interface TransStringResolver<T> {
	resolve: (str: TransString<T>) => string
}
