import { Promises } from "./promises"

/**
 * Promise, which can be resolved later using external callbacks returned.
 *
 * @deprecated use Promises.latePromise instead.
 */
export const latePromise = <T>(): [
	Promise<T>,
	(value: T) => void,
	(e: any) => void,
] => {
	return Promises.latePromise<T>()
}
