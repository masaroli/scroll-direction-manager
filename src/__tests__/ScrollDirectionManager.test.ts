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
      },
      writable: true,
    });

    onDirectionChangeMock = jest.fn();
    manager = new ScrollDirectionManager({
      onDirectionChange: onDirectionChangeMock,
      initialOffset: 10,
    });
  });

  test("should initialize with the correct initial offset", () => {
    expect(manager["initialOffset"]).toBe(10);
    expect(manager.getDirection()).toBe("initial");
    expect(manager.getPayload()).toBeUndefined();
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
});
