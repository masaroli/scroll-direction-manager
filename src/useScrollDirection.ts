import { useEffect, useRef, useState } from "react";
import {
  ScrollDirection,
  ScrollDirectionManager,
  ScrollDirectionManagerOptions,
} from "./ScrollDirectionManager";

export type UseScrollDirectionOptions = ScrollDirectionManagerOptions;

export type UseScrollDirectionResult = {
  direction: ScrollDirection;
  isUp: boolean;
  isDown: boolean;
  isInitial: boolean;
};

/**
 * React hook for tracking window scroll direction.
 *
 * @example
 * const { direction, isUp, isDown, isInitial } = useScrollDirection({
 *   initialOffset: 120,
 * });
 */
export function useScrollDirection(
  options: UseScrollDirectionOptions = {}
): UseScrollDirectionResult {
  const { initialOffset, onDirectionChange } = options;
  const [direction, setDirection] = useState<ScrollDirection>("initial");
  const onDirectionChangeRef = useRef(onDirectionChange);

  useEffect(() => {
    onDirectionChangeRef.current = onDirectionChange;
  }, [onDirectionChange]);

  useEffect(() => {
    const manager = new ScrollDirectionManager({
      initialOffset,
      onDirectionChange: (newDirection) => {
        setDirection(newDirection);
        onDirectionChangeRef.current?.(newDirection);
      },
    });

    return () => {
      manager.dispose();
    };
  }, [initialOffset]);

  return {
    direction,
    isUp: direction === "up",
    isDown: direction === "down",
    isInitial: direction === "initial",
  };
}
