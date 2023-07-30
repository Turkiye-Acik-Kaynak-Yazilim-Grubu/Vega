import { useState } from "react";
import { getDragHander } from "../utils";

export function useSelectRect() {
  const [rect, setRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const handleMouseDownForSelect = getDragHander(
    ({ diffX, diffY, startEvent }) => {
      const el = startEvent.target as HTMLElement;
      const rect = el.getBoundingClientRect();
      let left = startEvent.clientX - rect.left;
      let top = startEvent.clientY - rect.top;
      let width = diffX;
      let height = diffY;
      if (width < 0) {
        left += width;
        width = -width;
      }
      if (height < 0) {
        top += height;
        height = -height;
      }
      setRect({ left, top, width, height });
    },
    undefined,
    () => {
      setRect(null);
    }
  );
  return {
    handleMouseDownForSelect,
    rect,
  };
}
