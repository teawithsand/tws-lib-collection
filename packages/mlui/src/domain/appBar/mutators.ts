import { produce } from "@teawithsand/fstate"
import { AppBarNavigationButtonType } from "../../appBar/appBarTypes"
import type { AppBarMutator } from "./service"

export class AppBarMutators {
	private constructor() {}

	public static readonly ARROW_BACK_MUTATOR: AppBarMutator = (state) =>
		produce(state, (draft) => {
			draft.navigationConfig = {
				buttonType: AppBarNavigationButtonType.BACK,
			}
		})
}
