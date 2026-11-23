import { act, renderHook } from "@testing-library/react";
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
      ({ cb }) => useScrollDirection({ initialOffset: 50, onDirectionChange: cb }),
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
});
