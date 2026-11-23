export type ScrollDirection = "initial" | "up" | "down";

export type ScrollDirectionManagerOptions = {
  initialOffset?: number;
  onDirectionChange?: (direction: ScrollDirection) => void;
};

/**
 * @example
 * const scrollDirection = new ScrollDirectionManager({
 *   onDirectionChange: (direction) => {
 *     if (direction === "up") // do something if it's up
 *     else if (direction === "initial") // do if it's initial
 *   },
 *   initialOffset: 120,
 * });
 */
export class ScrollDirectionManager {
  private readonly onDirectionChange: ScrollDirectionManagerOptions["onDirectionChange"] =
    undefined;
  private scrollPosition: number;
  private scrollDirection: ScrollDirection = "initial";
  private readonly initialOffset: number = 120;

  public constructor({
    initialOffset,
    onDirectionChange,
  }: ScrollDirectionManagerOptions = {}) {
    this.scrollPosition = 0;
    if (initialOffset !== undefined) this.initialOffset = initialOffset;
    this.onDirectionChange = onDirectionChange;
    this.setupSubscriptions();
  }

  private readonly setupSubscriptions = (): void => {
    if (typeof window !== "undefined") {
      window.addEventListener("scroll", this.handleScrollDirection);
    }
  };

  private readonly handleScrollDirection = (): void => {
    if (typeof window === "undefined") return;

    const position = window.scrollY;
    let direction: ScrollDirection = "initial";

    if (position > this.initialOffset) {
      if (position < this.scrollPosition) {
        direction = "up";
      } else {
        direction = "down";
      }
    }

    if (direction !== this.scrollDirection) {
      this.onDirectionChange?.(direction);
    }

    this.scrollPosition = position;
    this.scrollDirection = direction;
  };

  public getDirection(): ScrollDirection {
    return this.scrollDirection;
  }

  public dispose(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("scroll", this.handleScrollDirection);
    }
  }
}
