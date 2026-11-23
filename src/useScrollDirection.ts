"use client";

import { useEffect, useRef, useState } from "react";
import {
  ResolvedScrollDirectionPayload,
  ScrollDirection,
  ScrollDirectionManager,
  ScrollDirectionManagerOptions,
  ScrollDirectionPayloadMap,
} from "./ScrollDirectionManager";

export type UseScrollDirectionOptions<
  TMap extends ScrollDirectionPayloadMap | undefined = undefined,
> = ScrollDirectionManagerOptions<TMap>;

export type UseScrollDirectionResult<
  TMap extends ScrollDirectionPayloadMap | undefined = undefined,
> = {
  direction: ScrollDirection;
  payload: ResolvedScrollDirectionPayload<TMap>;
  isUp: boolean;
  isDown: boolean;
  isInitial: boolean;
};

/**
 * React hook for tracking window scroll direction.
 *
 * @example
 * const { direction, payload, isUp, isDown, isInitial } = useScrollDirection({
 *   initialOffset: 120,
 *   payload: {
 *     initial: "navbar--top",
 *     up: "navbar--scrolled",
 *     down: "navbar--hidden",
 *   },
 * });
 */
export function useScrollDirection<
  TMap extends ScrollDirectionPayloadMap | undefined = undefined,
>(
  options: UseScrollDirectionOptions<TMap> = {}
): UseScrollDirectionResult<TMap> {
  const { initialOffset, payload, onDirectionChange } = options;
  const [direction, setDirection] = useState<ScrollDirection>("initial");
  const onDirectionChangeRef = useRef(onDirectionChange);
  const payloadRef = useRef(payload);

  useEffect(() => {
    onDirectionChangeRef.current = onDirectionChange;
  }, [onDirectionChange]);

  useEffect(() => {
    payloadRef.current = payload;
  }, [payload]);

  useEffect(() => {
    const manager = new ScrollDirectionManager({
      initialOffset,
      onDirectionChange: (newDirection) => {
        setDirection(newDirection);
        if (payloadRef.current !== undefined) {
          const resolvedPayload = payloadRef.current[
            newDirection
          ] as ResolvedScrollDirectionPayload<TMap>;
          onDirectionChangeRef.current?.(newDirection, resolvedPayload);
        } else {
          (
            onDirectionChangeRef.current as
              | ((direction: ScrollDirection) => void)
              | undefined
          )?.(newDirection);
        }
      },
    });

    setDirection(manager.getDirection());

    return () => {
      manager.dispose();
    };
  }, [initialOffset]);

  return {
    direction,
    payload: payload?.[direction] as ResolvedScrollDirectionPayload<TMap>,
    isUp: direction === "up",
    isDown: direction === "down",
    isInitial: direction === "initial",
  };
}
