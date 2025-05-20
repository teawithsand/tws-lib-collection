export enum ResultType {
	OK = 1,
	ERROR = 2,
}

export type Result<T, E = any> =
	| {
			type: ResultType.OK
			value: T
			error?: undefined
	  }
	| {
			type: ResultType.ERROR
			error: E
			value?: undefined
	  }
