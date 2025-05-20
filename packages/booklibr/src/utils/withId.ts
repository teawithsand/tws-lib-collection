export type Id = string

export type WithId<T> = {
	data: T
	id: string
}
