import { act, renderHook } from "@testing-library/react";
import { createRef } from "react";
import { useScrollDirection } from "../react";

describe("useScrollDirection", () => {
  const triggerScroll = (scrollY: number) => {
    act(() => {
      Object.defineProperty(window, "scrollY", {
        value: scrollY,
        writable: true,
        configurable: true,
      });
      window.dispatchEvent(new Event("scroll"));
    });
  };

  beforeEach(() => {
    Object.defineProperty(window, "scrollY", {
      value: 0,
      writable: true,
      configurable: true,
    });
  });

  test("returns initial state by default", () => {
    const { result } = renderHook(() => useScrollDirection());

    expect(result.current).toEqual({
      direction: "initial",
      isInitial: true,
      isUp: false,
      isDown: false,
    });
  });

  test("updates direction and boolean flags on scroll down, up, and back to initial offset", () => {
    const onDirectionChange = jest.fn();
    const { result } = renderHook(() =>
      useScrollDirection({ initialOffset: 50, onDirectionChange })
    );

    // Below initialOffset (30 <= 50) -> stays initial
    triggerScroll(30);
    expect(result.current.direction).toBe("initial");
    expect(result.current.isInitial).toBe(true);
    expect(onDirectionChange).not.toHaveBeenCalled();

    // Scroll down past initialOffset (150 > 50) -> down
    triggerScroll(150);
    expect(result.current).toEqual({
      direction: "down",
      isInitial: false,
      isUp: false,
      isDown: true,
    });
    expect(onDirectionChange).toHaveBeenCalledWith("down");

    // Scroll up while still above initialOffset (100 > 50 && 100 < 150) -> up
    triggerScroll(100);
    expect(result.current).toEqual({
      direction: "up",
      isInitial: false,
      isUp: true,
      isDown: false,
    });
    expect(onDirectionChange).toHaveBeenCalledWith("up");

    // Scroll back within initialOffset (20 <= 50) -> initial
    triggerScroll(20);
    expect(result.current).toEqual({
      direction: "initial",
      isInitial: true,
      isUp: false,
      isDown: false,
    });
    expect(onDirectionChange).toHaveBeenCalledWith("initial");
  });

  test("does not re-subscribe scroll listener when onDirectionChange callback changes", () => {
    const addEventListenerSpy = jest.spyOn(window, "addEventListener");
    const firstCallback = jest.fn();
    const secondCallback = jest.fn();

    const { rerender } = renderHook(
      ({ cb }) =>
        useScrollDirection({ initialOffset: 50, onDirectionChange: cb }),
      { initialProps: { cb: firstCallback } }
    );

    rerender({ cb: secondCallback });

    expect(addEventListenerSpy).toHaveBeenCalledTimes(1);

    triggerScroll(150);
    expect(firstCallback).not.toHaveBeenCalled();
    expect(secondCallback).toHaveBeenCalledWith("down");

    addEventListenerSpy.mockRestore();
  });

  test("resets direction to initial when initialOffset changes", () => {
    const { result, rerender } = renderHook(
      ({ offset }) => useScrollDirection({ initialOffset: offset }),
      { initialProps: { offset: 50 } }
    );

    triggerScroll(150);
    expect(result.current.direction).toBe("down");

    rerender({ offset: 200 });
    expect(result.current).toEqual({
      direction: "initial",
      isInitial: true,
      isUp: false,
      isDown: false,
    });
  });

  test("cleans up window scroll event listener on unmount", () => {
    const addEventListenerSpy = jest.spyOn(window, "addEventListener");
    const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useScrollDirection());

    const registeredListener = addEventListenerSpy.mock.calls.find(
      ([eventName]) => eventName === "scroll"
    )?.[1];

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "scroll",
      registeredListener
    );
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  test("resolves custom payload for each direction and passes it to onDirectionChange", () => {
    const onDirectionChange = jest.fn();
    const { result } = renderHook(() =>
      useScrollDirection({
        initialOffset: 50,
        payload: {
          initial: "navbar--top",
          up: "navbar--scrolled",
          down: "navbar--hidden",
        } as const,
        onDirectionChange: (direction, payload) => {
          const typedPayload:
            | "navbar--top"
            | "navbar--scrolled"
            | "navbar--hidden" = payload;
          onDirectionChange(direction, typedPayload);
        },
      })
    );

    expect(result.current).toEqual({
      direction: "initial",
      payload: "navbar--top",
      isInitial: true,
      isUp: false,
      isDown: false,
    });

    triggerScroll(150);
    expect(result.current).toEqual({
      direction: "down",
      payload: "navbar--hidden",
      isInitial: false,
      isUp: false,
      isDown: true,
    });
    expect(onDirectionChange).toHaveBeenLastCalledWith(
      "down",
      "navbar--hidden"
    );

    triggerScroll(100);
    expect(result.current).toEqual({
      direction: "up",
      payload: "navbar--scrolled",
      isInitial: false,
      isUp: true,
      isDown: false,
    });
    expect(onDirectionChange).toHaveBeenLastCalledWith(
      "up",
      "navbar--scrolled"
    );

    triggerScroll(20);
    expect(result.current).toEqual({
      direction: "initial",
      payload: "navbar--top",
      isInitial: true,
      isUp: false,
      isDown: false,
    });
    expect(onDirectionChange).toHaveBeenLastCalledWith(
      "initial",
      "navbar--top"
    );
  });

  test("does not re-subscribe when inline payload object changes and uses latest payload", () => {
    const addEventListenerSpy = jest.spyOn(window, "addEventListener");
    const onDirectionChange = jest.fn();

    const { result, rerender } = renderHook(
      ({ downLabel }) =>
        useScrollDirection({
          initialOffset: 50,
          payload: {
            initial: "show",
            up: "show",
            down: downLabel,
          },
          onDirectionChange,
        }),
      { initialProps: { downLabel: "hide-v1" } }
    );

    rerender({ downLabel: "hide-v2" });

    expect(addEventListenerSpy).toHaveBeenCalledTimes(1);

    triggerScroll(150);
    expect(result.current.payload).toBe("hide-v2");
    expect(onDirectionChange).toHaveBeenCalledWith("down", "hide-v2");

    addEventListenerSpy.mockRestore();
  });

  test("supports partial payload maps in useScrollDirection", () => {
    const onDirectionChange = jest.fn();
    const { result } = renderHook(() =>
      useScrollDirection({
        initialOffset: 50,
        payload: {
          down: "hide",
        },
        onDirectionChange,
      })
    );

    expect(result.current.payload).toBeUndefined();

    triggerScroll(150);
    expect(result.current.payload).toBe("hide");
    expect(onDirectionChange).toHaveBeenLastCalledWith("down", "hide");

    triggerScroll(100);
    expect(result.current.payload).toBeUndefined();
    expect(onDirectionChange).toHaveBeenLastCalledWith("up", undefined);
  });

  test("resets direction and scrollPosition when resetKey changes (SPA route change)", () => {
    const onDirectionChange = jest.fn();
    const { result, rerender } = renderHook(
      ({ pathname }) =>
        useScrollDirection({
          initialOffset: 120,
          resetKey: pathname,
          onDirectionChange,
        }),
      { initialProps: { pathname: "/home" } }
    );

    // Scroll far down on /home
    triggerScroll(1200);
    expect(result.current.direction).toBe("down");
    onDirectionChange.mockClear();

    // Rerendering with the same resetKey keeps current direction
    rerender({ pathname: "/home" });
    expect(result.current.direction).toBe("down");
    expect(onDirectionChange).not.toHaveBeenCalled();

    // Router resets window.scrollY to 0 without firing a scroll event, then pathname changes
    Object.defineProperty(window, "scrollY", {
      value: 0,
      writable: true,
      configurable: true,
    });
    rerender({ pathname: "/about" });

    expect(result.current.direction).toBe("initial");
    expect(result.current.isInitial).toBe(true);
    expect(onDirectionChange).toHaveBeenCalledWith("initial");
    onDirectionChange.mockClear();

    // Scrolling down to 150px on /about must report "down" (not "up" vs stale 1200)
    triggerScroll(150);
    expect(result.current.direction).toBe("down");
    expect(onDirectionChange).toHaveBeenCalledWith("down");
  });

  test("respects threshold option in useScrollDirection", () => {
    const { result } = renderHook(() =>
      useScrollDirection({ initialOffset: 50, threshold: 15 })
    );

    triggerScroll(200);
    expect(result.current.direction).toBe("down");

    // 5px bounce up (< 15px threshold) stays "down"
    triggerScroll(195);
    expect(result.current.direction).toBe("down");

    // Cumulative 20px up (>= 15px) flips to "up"
    triggerScroll(180);
    expect(result.current.direction).toBe("up");
  });

  test("tracks a scrollable HTMLElement passed via React ref", () => {
    const container = document.createElement("div");
    let scrollTop = 0;
    Object.defineProperty(container, "scrollTop", {
      get: () => scrollTop,
      set: (v: number) => {
        scrollTop = v;
      },
      configurable: true,
    });

    const ref = createRef<HTMLDivElement>();
    (ref as { current: HTMLDivElement | null }).current = container;

    const { result } = renderHook(() =>
      useScrollDirection({ initialOffset: 40, target: ref })
    );

    // Window scroll should NOT affect container-bound hook
    triggerScroll(300);
    expect(result.current.direction).toBe("initial");

    // Container scroll updates hook state
    act(() => {
      scrollTop = 120;
      container.dispatchEvent(new Event("scroll"));
    });
    expect(result.current.direction).toBe("down");

    act(() => {
      scrollTop = 70;
      container.dispatchEvent(new Event("scroll"));
    });
    expect(result.current.direction).toBe("up");
  });

  test("coalesces scroll events via requestAnimationFrame when enabled", () => {
    const callbacks: FrameRequestCallback[] = [];
    const rafMock = jest.fn((cb: FrameRequestCallback) => {
      callbacks.push(cb);
      return callbacks.length;
    });
    const cancelRafMock = jest.fn();

    const origRaf = global.requestAnimationFrame;
    const origCancelRaf = global.cancelAnimationFrame;
    global.requestAnimationFrame = rafMock;
    global.cancelAnimationFrame = cancelRafMock;

    try {
      const { result, unmount } = renderHook(() =>
        useScrollDirection({ initialOffset: 50, useAnimationFrame: true })
      );

      triggerScroll(150);
      triggerScroll(220);
      expect(rafMock).toHaveBeenCalledTimes(1);
      expect(result.current.direction).toBe("initial");

      act(() => {
        callbacks[0](16);
      });
      expect(result.current.direction).toBe("down");

      // Queue another rAF and unmount before flush
      triggerScroll(120);
      expect(rafMock).toHaveBeenCalledTimes(2);

      unmount();
      expect(cancelRafMock).toHaveBeenCalledWith(2);
    } finally {
      global.requestAnimationFrame = origRaf;
      global.cancelAnimationFrame = origCancelRaf;
    }
  });
});
