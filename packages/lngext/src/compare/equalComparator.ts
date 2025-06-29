export interface EqualComparator<T> {
	equals: (a: T, b: T) => boolean
}
