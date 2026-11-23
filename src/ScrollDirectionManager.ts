export type ScrollDirection = "initial" | "up" | "down";

export type ScrollDirectionManagerOptions = {
  initialOffset?: number;
  onDirectionChange?: (direction: ScrollDirection) => void;
};

export class ScrollDirectionManager {
  private readonly onDirectionChange: ScrollDirectionManagerOptions["onDirectionChange"] =
    undefined;
  private scrollPosition: number;
  private scrollDirection: ScrollDirection = "initial";
  private readonly initialOffset: number = 120;

  private scrollListener: EventListener | null = null;

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
    if (typeof window === "undefined") return;

    // Setting up the scroll event listener
    this.scrollListener = this.handleScrollDirection.bind(this);
    window.addEventListener("scroll", this.scrollListener);
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
    // Remove the event listener when disposing
    if (typeof window !== "undefined" && this.scrollListener) {
      window.removeEventListener("scroll", this.scrollListener);
      this.scrollListener = null;
    }
  }
}
