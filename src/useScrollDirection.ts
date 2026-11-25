"use client";

import { RefObject, useEffect, useRef, useState } from "react";
import {
  ResolvedScrollDirectionPayload,
  ScrollDirection,
  ScrollDirectionManager,
  ScrollDirectionManagerOptions,
  ScrollDirectionPayloadMap,
  ScrollTarget,
} from "./ScrollDirectionManager";

export type UseScrollDirectionTarget =
  | ScrollTarget
  | RefObject<HTMLElement | null>
  | null;

export type UseScrollDirectionOptions<
  TMap extends ScrollDirectionPayloadMap | undefined = undefined,
> = Omit<ScrollDirectionManagerOptions<TMap>, "target"> & {
  target?: UseScrollDirectionTarget;
  resetKey?: unknown;
};

export type UseScrollDirectionResult<
  TMap extends ScrollDirectionPayloadMap | undefined = undefined,
> = {
  direction: ScrollDirection;
  payload: ResolvedScrollDirectionPayload<TMap>;
  isUp: boolean;
  isDown: boolean;
  isInitial: boolean;
};

function isRefObject(
  target: UseScrollDirectionTarget | undefined
): target is RefObject<HTMLElement | null> {
  return typeof target === "object" && target !== null && "current" in target;
}

/**
 * React hook for tracking scroll direction on `window` or a scrollable element.
 *
 * @example
 * const { direction, payload, isUp, isDown, isInitial } = useScrollDirection({
 *   initialOffset: 120,
 *   threshold: 8,
 *   resetKey: pathname,
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
  const {
    initialOffset,
    threshold,
    target,
    useAnimationFrame,
    resetKey,
    payload,
    onDirectionChange,
  } = options;
  const [direction, setDirection] = useState<ScrollDirection>("initial");
  const managerRef = useRef<ScrollDirectionManager | null>(null);
  const onDirectionChangeRef = useRef(onDirectionChange);
  const payloadRef = useRef(payload);
  const prevResetKeyRef = useRef(resetKey);

  useEffect(() => {
    onDirectionChangeRef.current = onDirectionChange;
  }, [onDirectionChange]);

  useEffect(() => {
    payloadRef.current = payload;
  }, [payload]);

  useEffect(() => {
    const resolvedTarget: ScrollTarget | null | undefined = isRefObject(target)
      ? target.current
      : target;

    const manager = new ScrollDirectionManager({
      initialOffset,
      threshold,
      target: resolvedTarget,
      useAnimationFrame,
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

    managerRef.current = manager;
    setDirection(manager.getDirection());

    return () => {
      manager.dispose();
      if (managerRef.current === manager) {
        managerRef.current = null;
      }
    };
  }, [initialOffset, threshold, useAnimationFrame, target]);

  useEffect(() => {
    if (Object.is(prevResetKeyRef.current, resetKey)) {
      return;
    }

    prevResetKeyRef.current = resetKey;
    managerRef.current?.reset();
    setDirection("initial");
  }, [resetKey]);

  return {
    direction,
    payload: payload?.[direction] as ResolvedScrollDirectionPayload<TMap>,
    isUp: direction === "up",
    isDown: direction === "down",
    isInitial: direction === "initial",
  };
}
