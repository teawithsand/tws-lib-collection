import {
	closestCenter,
	DndContext,
	DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core"
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import React from "react"
import styles from "./dnd.module.scss"
import { SortableItem, useSortableListExample } from "./useSortableListExample"

export interface SortableItemProps {
	readonly item: SortableItem
}

export const SortableItemComponent: React.FC<SortableItemProps> = ({
	item,
}) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: item.id })

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			className={styles.sortableItem}
		>
			<div className={styles.sortableItemContent}>
				<span className={styles.dragHandle} {...listeners}>
					⋮⋮
				</span>
				<span>{item.content}</span>
			</div>
		</div>
	)
}

export interface SortableListProps {
	readonly items: readonly SortableItem[]
	readonly onItemsChange: (items: readonly SortableItem[]) => void
}

export const SortableList: React.FC<SortableListProps> = ({
	items,
	onItemsChange,
}) => {
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	)

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event

		if (active.id !== over?.id) {
			const oldIndex = items.findIndex((item) => item.id === active.id)
			const newIndex = items.findIndex((item) => item.id === over?.id)

			const newItems = arrayMove([...items], oldIndex, newIndex)
			onItemsChange(newItems)
		}
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
		>
			<SortableContext
				items={items.map((item) => item.id)}
				strategy={verticalListSortingStrategy}
			>
				<div className={styles.sortableList}>
					{items.map((item) => (
						<SortableItemComponent key={item.id} item={item} />
					))}
				</div>
			</SortableContext>
		</DndContext>
	)
}

export const SortableListExample: React.FC = () => {
	const { items, setItems } = useSortableListExample()

	return (
		<div className={styles.sortableListExample}>
			<h3>Sortable List Example</h3>
			<p>Drag and drop items to reorder them:</p>
			<SortableList items={items} onItemsChange={setItems} />
		</div>
	)
}
