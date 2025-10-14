import { Abook, WithId } from "@teawithsand/booklibr"
import { atom, Atom, atomWithImmer, loadable } from "@teawithsand/fstate"
import {
	Comparator,
	ComparatorUtil,
	inPlace,
	naturalStringComparator,
	TypeAssert,
} from "@teawithsand/lngext"

export enum AbookListSortField {
	NAME = "name",
}

export type AbookListSort = {
	desc?: boolean
	field: AbookListSortField
}

export class AbookListBehavior {
	public readonly abooks
	public readonly abookSort
	public readonly abooksLoadable

	constructor(private readonly inputAbooks: Atom<Promise<WithId<Abook>[]>>) {
		this.abookSort = atomWithImmer<AbookListSort>({
			desc: false,
			field: AbookListSortField.NAME,
		})

		this.abooks = atom(async (get) => {
			const inputAbooks = [...(await get(this.inputAbooks))]

			const sort = get(this.abookSort)

			const innerComparator: Comparator<WithId<Abook>> = inPlace(() => {
				if (sort.field === AbookListSortField.NAME) {
					return ComparatorUtil.fromFn((a, b) =>
						naturalStringComparator.compare(
							a.data.data.header.metadata.title,
							b.data.data.header.metadata.title,
						),
					)
				} else {
					TypeAssert.assertNever(sort.field)
					TypeAssert.unreachable()
				}
			})

			const comparator = inPlace(() => {
				if (sort.desc) {
					return ComparatorUtil.reverse(innerComparator)
				} else {
					return innerComparator
				}
			})

			inputAbooks.sort(comparator.compare.bind(comparator))

			return inputAbooks
		})
		this.abooksLoadable = loadable(this.abooks)
	}
}
