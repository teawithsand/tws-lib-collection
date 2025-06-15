import { TransString } from "./transString"

export interface TransErrorExplainer<T> {
	explainError: (error: unknown) => TransString<T>
}
