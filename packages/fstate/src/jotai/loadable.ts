export type Loadable<T> =
	| {
			state: "hasData"
			data: T
			error?: undefined
	  }
	| {
			state: "hasError"
			data?: undefined
			error: any
	  }
	| {
			state: "loading"
			data?: undefined
			error?: undefined
	  }
