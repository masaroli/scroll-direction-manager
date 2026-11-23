import { act, renderHook } from "@testing-library/react";
import { useScrollDirection } from "../useScrollDirection";

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

  test("cleans up window scroll event listener on unmount", () => {
    const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useScrollDirection());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function)
    );
    removeEventListenerSpy.mockRestore();
  });
});
