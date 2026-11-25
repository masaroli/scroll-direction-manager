import { ScrollDirectionManager } from "../ScrollDirectionManager";

describe("ScrollDirectionManager", () => {
  let manager: ScrollDirectionManager;
  const scrollEvents: number[] = [0, 200, 100, 300];
  let onDirectionChangeMock: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    Object.defineProperty(global, "window", {
      value: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        scrollY: 0,
        innerHeight: 0,
      },
      writable: true,
      configurable: true,
    });

    onDirectionChangeMock = jest.fn();
    manager = new ScrollDirectionManager({
      onDirectionChange: onDirectionChangeMock,
      initialOffset: 10,
    });
  });

  test("should initialize with the correct initial offset and passive listener", () => {
    expect(manager["initialOffset"]).toBe(10);
    expect(manager.getDirection()).toBe("initial");
    expect(manager.getPayload()).toBeUndefined();
    expect(window.addEventListener).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
      { passive: true }
    );
  });

  test("should support an initial offset of 0", () => {
    const zeroOffsetManager = new ScrollDirectionManager({ initialOffset: 0 });
    expect(zeroOffsetManager["initialOffset"]).toBe(0);
    zeroOffsetManager.dispose();
  });

  test("should call onDirectionChange when scroll direction changes", () => {
    scrollEvents.forEach((scrollY, index) => {
      Object.defineProperty(global.window, "scrollY", {
        value: scrollY,
        writable: true,
      });

      manager["handleScrollDirection"]();

      if (index === 0) {
        expect(onDirectionChangeMock).not.toHaveBeenCalled();
      } else if (scrollY > scrollEvents[index - 1]) {
        expect(onDirectionChangeMock).toHaveBeenCalledWith("down");
      } else {
        expect(onDirectionChangeMock).toHaveBeenCalledWith("up");
      }

      onDirectionChangeMock.mockClear();
    });
  });

  test("should remove the registered event listener once on dispose", () => {
    const registeredListener = (window.addEventListener as jest.Mock).mock
      .calls[0][1];

    manager.dispose();
    manager.dispose();

    expect(window.removeEventListener).toHaveBeenCalledTimes(1);
    expect(window.removeEventListener).toHaveBeenCalledWith(
      "scroll",
      registeredListener
    );
  });

  test("should pass custom payload to onDirectionChange and expose it via getPayload", () => {
    const callback = jest.fn();
    const customManager = new ScrollDirectionManager({
      initialOffset: 50,
      payload: {
        initial: "show",
        up: "show",
        down: "hide",
      } as const,
      onDirectionChange: (direction, payload) => {
        const typedPayload: "show" | "hide" = payload;
        callback(direction, typedPayload);
      },
    });

    expect(customManager.getPayload()).toBe("show");

    Object.defineProperty(global.window, "scrollY", {
      value: 150,
      writable: true,
    });
    customManager["handleScrollDirection"]();
    expect(callback).toHaveBeenLastCalledWith("down", "hide");
    expect(customManager.getPayload()).toBe("hide");

    Object.defineProperty(global.window, "scrollY", {
      value: 100,
      writable: true,
    });
    customManager["handleScrollDirection"]();
    expect(callback).toHaveBeenLastCalledWith("up", "show");
    expect(customManager.getPayload()).toBe("show");

    Object.defineProperty(global.window, "scrollY", {
      value: 20,
      writable: true,
    });
    customManager["handleScrollDirection"]();
    expect(callback).toHaveBeenLastCalledWith("initial", "show");
    expect(customManager.getPayload()).toBe("show");

    customManager.dispose();
  });

  test("should support partial payload maps", () => {
    const callback = jest.fn();
    const partialManager = new ScrollDirectionManager({
      initialOffset: 50,
      payload: {
        down: { hidden: true },
      },
      onDirectionChange: (direction, payload) => {
        const typedPayload: { hidden: boolean } | undefined = payload;
        callback(direction, typedPayload);
      },
    });

    expect(partialManager.getPayload()).toBeUndefined();

    Object.defineProperty(global.window, "scrollY", {
      value: 150,
      writable: true,
    });
    partialManager["handleScrollDirection"]();
    expect(callback).toHaveBeenLastCalledWith("down", { hidden: true });
    expect(partialManager.getPayload()).toEqual({ hidden: true });

    Object.defineProperty(global.window, "scrollY", {
      value: 100,
      writable: true,
    });
    partialManager["handleScrollDirection"]();
    expect(callback).toHaveBeenLastCalledWith("up", undefined);
    expect(partialManager.getPayload()).toBeUndefined();

    partialManager.dispose();
  });

  test("should initialize scrollPosition from current window.scrollY on mid-page load", () => {
    Object.defineProperty(global.window, "scrollY", {
      value: 800,
      writable: true,
    });
    const callback = jest.fn();
    const midPageManager = new ScrollDirectionManager({
      initialOffset: 120,
      onDirectionChange: callback,
    });

    Object.defineProperty(global.window, "scrollY", {
      value: 780,
      writable: true,
    });
    midPageManager["handleScrollDirection"]();

    expect(midPageManager.getDirection()).toBe("up");
    expect(callback).toHaveBeenCalledWith("up");
    midPageManager.dispose();
  });

  test("should resync scrollPosition and reset direction to initial on reset()", () => {
    const callback = jest.fn();
    const spaManager = new ScrollDirectionManager({
      initialOffset: 120,
      payload: {
        initial: "top",
        up: "show",
        down: "hide",
      } as const,
      onDirectionChange: callback,
    });

    // Scroll far down on route A
    Object.defineProperty(global.window, "scrollY", {
      value: 1200,
      writable: true,
    });
    spaManager["handleScrollDirection"]();
    expect(spaManager.getDirection()).toBe("down");
    expect(callback).toHaveBeenLastCalledWith("down", "hide");
    callback.mockClear();

    // SPA route change resets scrollY to 0 without emitting scroll event
    Object.defineProperty(global.window, "scrollY", {
      value: 0,
      writable: true,
    });
    spaManager.reset();
    expect(spaManager.getDirection()).toBe("initial");
    expect(spaManager.getPayload()).toBe("top");
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith("initial", "top");

    // Calling reset again while already initial should not re-fire callback
    callback.mockClear();
    spaManager.reset();
    expect(callback).not.toHaveBeenCalled();

    // Scrolling down on route B to 150px must report "down", not "up"
    Object.defineProperty(global.window, "scrollY", {
      value: 150,
      writable: true,
    });
    spaManager["handleScrollDirection"]();
    expect(spaManager.getDirection()).toBe("down");
    expect(callback).toHaveBeenLastCalledWith("down", "hide");

    spaManager.dispose();
  });

  test("should ignore micro-jitter below threshold and still return to initial immediately", () => {
    const callback = jest.fn();
    const thresholdManager = new ScrollDirectionManager({
      initialOffset: 120,
      threshold: 10,
      onDirectionChange: callback,
    });

    // Scroll down to 200 -> "down"
    Object.defineProperty(global.window, "scrollY", {
      value: 200,
      writable: true,
    });
    thresholdManager["handleScrollDirection"]();
    expect(thresholdManager.getDirection()).toBe("down");
    callback.mockClear();

    // Small upward jitter (< 10px) -> ignored, scrollPosition stays anchored at 200
    Object.defineProperty(global.window, "scrollY", {
      value: 194,
      writable: true,
    });
    thresholdManager["handleScrollDirection"]();
    expect(thresholdManager.getDirection()).toBe("down");
    expect(callback).not.toHaveBeenCalled();

    // Continued slow upward scroll reaching >= 10px cumulative delta (200 - 188 = 12) -> "up"
    Object.defineProperty(global.window, "scrollY", {
      value: 188,
      writable: true,
    });
    thresholdManager["handleScrollDirection"]();
    expect(thresholdManager.getDirection()).toBe("up");
    expect(callback).toHaveBeenCalledWith("up");
    callback.mockClear();

    // Move to 125 (still > initialOffset) then step 5px (< threshold) into initial zone (120)
    Object.defineProperty(global.window, "scrollY", {
      value: 125,
      writable: true,
    });
    thresholdManager["handleScrollDirection"]();
    Object.defineProperty(global.window, "scrollY", {
      value: 120,
      writable: true,
    });
    thresholdManager["handleScrollDirection"]();
    expect(thresholdManager.getDirection()).toBe("initial");
    expect(callback).toHaveBeenCalledWith("initial");

    thresholdManager.dispose();
  });

  test("should clamp negative top bounce and bottom iOS overscroll", () => {
    const callback = jest.fn();
    Object.defineProperty(global.window, "innerHeight", {
      value: 800,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, "scrollHeight", {
      value: 2800,
      writable: true,
      configurable: true,
    });

    const bounceManager = new ScrollDirectionManager({
      initialOffset: 120,
      onDirectionChange: callback,
    });

    // Top negative overscroll (-30 -> -10 -> 0) stays "initial"
    for (const y of [-30, -10, 0]) {
      Object.defineProperty(global.window, "scrollY", {
        value: y,
        writable: true,
      });
      bounceManager["handleScrollDirection"]();
      expect(bounceManager.getDirection()).toBe("initial");
    }
    expect(callback).not.toHaveBeenCalled();

    // Scroll down near bottom (1950) then overscroll past maxScroll (2000) to 2040
    Object.defineProperty(global.window, "scrollY", {
      value: 1950,
      writable: true,
    });
    bounceManager["handleScrollDirection"]();
    expect(bounceManager.getDirection()).toBe("down");
    callback.mockClear();

    // Rubber-band past bottom and snap back: 2040 -> 2020 -> 2000 must stay "down"
    for (const y of [2040, 2020, 2000]) {
      Object.defineProperty(global.window, "scrollY", {
        value: y,
        writable: true,
      });
      bounceManager["handleScrollDirection"]();
      expect(bounceManager.getDirection()).toBe("down");
    }
    expect(callback).not.toHaveBeenCalled();

    // Genuine upward scroll from bottom (2000 -> 1950) reports "up"
    Object.defineProperty(global.window, "scrollY", {
      value: 1950,
      writable: true,
    });
    bounceManager["handleScrollDirection"]();
    expect(bounceManager.getDirection()).toBe("up");
    expect(callback).toHaveBeenCalledWith("up");

    Object.defineProperty(document.documentElement, "scrollHeight", {
      value: 0,
      writable: true,
      configurable: true,
    });
    bounceManager.dispose();
  });

  test("should coalesce scroll events via requestAnimationFrame when enabled", () => {
    const callbacks: FrameRequestCallback[] = [];
    const rafMock = jest
      .fn((cb: FrameRequestCallback) => {
        callbacks.push(cb);
        return callbacks.length;
      });
    const cancelRafMock = jest.fn();

    const origRaf = global.requestAnimationFrame;
    const origCancelRaf = global.cancelAnimationFrame;
    global.requestAnimationFrame = rafMock;
    global.cancelAnimationFrame = cancelRafMock;

    try {
      const onChange = jest.fn();
      const rafManager = new ScrollDirectionManager({
        initialOffset: 50,
        useAnimationFrame: true,
        onDirectionChange: onChange,
      });

      const scrollListener = (window.addEventListener as jest.Mock).mock
        .calls[1][1] as EventListener;

      // Dispatch multiple scroll events within the same frame
      Object.defineProperty(global.window, "scrollY", {
        value: 100,
        writable: true,
      });
      scrollListener(new Event("scroll"));
      Object.defineProperty(global.window, "scrollY", {
        value: 220,
        writable: true,
      });
      scrollListener(new Event("scroll"));

      expect(rafMock).toHaveBeenCalledTimes(1);
      expect(onChange).not.toHaveBeenCalled();

      // Flush frame
      callbacks[0](16);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith("down");

      // Schedule another frame and dispose before it fires -> cancels pending rAF
      Object.defineProperty(global.window, "scrollY", {
        value: 120,
        writable: true,
      });
      scrollListener(new Event("scroll"));
      expect(rafMock).toHaveBeenCalledTimes(2);

      rafManager.dispose();
      expect(cancelRafMock).toHaveBeenCalledWith(2);
    } finally {
      global.requestAnimationFrame = origRaf;
      global.cancelAnimationFrame = origCancelRaf;
    }
  });

  test("should support a custom HTMLElement target and handle null target safely", () => {
    const container = document.createElement("div");
    let scrollTop = 0;
    Object.defineProperty(container, "scrollTop", {
      get: () => scrollTop,
      set: (v: number) => {
        scrollTop = v;
      },
      configurable: true,
    });
    Object.defineProperty(container, "scrollHeight", {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(container, "clientHeight", {
      value: 400,
      configurable: true,
    });

    const addSpy = jest.spyOn(container, "addEventListener");
    const removeSpy = jest.spyOn(container, "removeEventListener");
    const onChange = jest.fn();

    const elementManager = new ScrollDirectionManager({
      target: container,
      initialOffset: 50,
      onDirectionChange: onChange,
    });

    expect(addSpy).toHaveBeenCalledWith("scroll", expect.any(Function), {
      passive: true,
    });

    scrollTop = 200;
    container.dispatchEvent(new Event("scroll"));
    expect(elementManager.getDirection()).toBe("down");
    expect(onChange).toHaveBeenLastCalledWith("down");

    scrollTop = 120;
    container.dispatchEvent(new Event("scroll"));
    expect(elementManager.getDirection()).toBe("up");
    expect(onChange).toHaveBeenLastCalledWith("up");

    elementManager.dispose();
    expect(removeSpy).toHaveBeenCalledWith("scroll", expect.any(Function));

    // Passing target: null must not attach to window
    const windowAddCallsBefore = (window.addEventListener as jest.Mock).mock
      .calls.length;
    const nullManager = new ScrollDirectionManager({ target: null });
    expect((window.addEventListener as jest.Mock).mock.calls.length).toBe(
      windowAddCallsBefore
    );
    expect(nullManager.getDirection()).toBe("initial");
    nullManager.dispose();
  });
});
