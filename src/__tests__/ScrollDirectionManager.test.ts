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
});
