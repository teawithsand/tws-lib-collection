export interface Conn<T = ArrayBuffer> {
	receive: () => Promise<T>
	send: (message: T) => Promise<void>
	close: () => void
}

export interface ConnHandler<T> {
	handleConnection: (conn: Conn<T>) => Promise<void>
}

export interface Client<A, T> {
	connect: (address: A) => Promise<Conn<T>>
}
