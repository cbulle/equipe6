import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

interface DragState {
  orderedIds: string[];
  draggedId: string;
}

const KEYBOARD_OFFSETS: Record<string, number> = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 };

const moveId = (ids: string[], id: string, toIndex: number) => {
  const next = ids.filter((current) => current !== id);
  next.splice(toIndex, 0, id);
  return next;
};

/**
 * Drag and drop reordering driven by pointer events, so it works with a mouse and on touch
 * screens, in vertical as well as horizontal lists. The handle also responds to the arrow keys.
 * `onReorder` receives every id in the new order once the item is dropped; that order stays
 * displayed until `items` reflects it or the returned promise settles.
 */
export function useSortableList<T extends { id: string }>(
  items: T[],
  onReorder: (orderedIds: string[]) => Promise<void>,
) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [pending, setPending] = useState<{ orderedIds: string[]; basedOn: string } | null>(null);
  const elements = useRef(new Map<string, HTMLElement>());

  const itemsKey = items.map((item) => item.id).join('|');
  const displayedIds = drag?.orderedIds ?? (pending?.basedOn === itemsKey ? pending.orderedIds : null);
  const itemsById = new Map(items.map((item) => [item.id, item]));
  const orderedItems = displayedIds
    ? displayedIds.flatMap((id) => {
        const item = itemsById.get(id);
        return item ? [item] : [];
      })
    : items;

  const handlePointerMove = (event: PointerEvent) => {
    if (!drag) {
      return;
    }
    const draggedIndex = drag.orderedIds.indexOf(drag.draggedId);
    const draggedRect = elements.current.get(drag.draggedId)?.getBoundingClientRect();
    for (const [targetIndex, targetId] of drag.orderedIds.entries()) {
      const rect = elements.current.get(targetId)?.getBoundingClientRect();
      if (targetId === drag.draggedId || !rect || !draggedRect) {
        continue;
      }
      const isInside =
        event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (!isInside) {
        continue;
      }
      // Only swap once the pointer crosses the middle of the target, so items of different
      // sizes do not flip back and forth.
      const isVertical = Math.abs(rect.top - draggedRect.top) >= Math.abs(rect.left - draggedRect.left);
      const position = isVertical ? event.clientY : event.clientX;
      const middle = isVertical ? rect.top + rect.height / 2 : rect.left + rect.width / 2;
      if (targetIndex < draggedIndex ? position < middle : position > middle) {
        setDrag({ ...drag, orderedIds: moveId(drag.orderedIds, drag.draggedId, targetIndex) });
      }
      return;
    }
  };

  const commit = (orderedIds: string[]) => {
    setPending({ orderedIds, basedOn: itemsKey });
    onReorder(orderedIds).finally(() => setPending(null));
  };

  const endDrag = () => {
    if (!drag) {
      return;
    }
    if (drag.orderedIds.some((id, index) => items[index]?.id !== id)) {
      commit(drag.orderedIds);
    }
    setDrag(null);
  };

  const handleKeyDown = (id: string) => (event: KeyboardEvent) => {
    const offset = KEYBOARD_OFFSETS[event.key];
    const ids = orderedItems.map((item) => item.id);
    const targetIndex = ids.indexOf(id) + (offset ?? 0);
    if (!offset || targetIndex < 0 || targetIndex >= ids.length) {
      return;
    }
    event.preventDefault();
    commit(moveId(ids, id, targetIndex));
  };

  return {
    orderedItems,
    draggedId: drag?.draggedId ?? null,
    /** Spread on the element that moves; it is used to detect where the item is dropped. */
    itemRef: (id: string) => (element: HTMLElement | null) => {
      if (element) {
        elements.current.set(id, element);
      } else {
        elements.current.delete(id);
      }
    },
    /** Spread on the grip the user grabs. */
    handleProps: (id: string) => ({
      onPointerDown: (event: PointerEvent<HTMLElement>) => {
        if (event.button !== 0 || items.length < 2) {
          return;
        }
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        setDrag({ orderedIds: items.map((item) => item.id), draggedId: id });
      },
      onPointerMove: handlePointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onKeyDown: handleKeyDown(id),
    }),
  };
}
