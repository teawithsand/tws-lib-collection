export interface CardStateReducer<Event, State> {
	readonly fold: (state: State, event: Event) => State
	readonly getDefaultState: () => State
}
