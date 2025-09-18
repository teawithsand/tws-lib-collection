import { useState } from "react"

export interface SortableItem {
	readonly id: string
	readonly content: string
}

export const useSortableListExample = () => {
	const [items, setItems] = useState<readonly SortableItem[]>([
		{ id: "1", content: "First Item - Drag me around!" },
		{ id: "2", content: "Second Item - I can be sorted" },
		{ id: "3", content: "Third Item - Reorder the list" },
		{ id: "4", content: "Fourth Item - Use drag handles" },
		{ id: "5", content: "Fifth Item - Keyboard accessible" },
		{ id: "6", content: "Sixth Item - Touch friendly" },
		{ id: "7", content: "Seventh Item - Smooth animations" },
		{ id: "8", content: "Eighth Item - Auto-scroll support" },
		{ id: "9", content: "Ninth Item - Collision detection" },
		{ id: "10", content: "Tenth Item - Last but not least!" },
	])

	return {
		items,
		setItems,
	}
}
