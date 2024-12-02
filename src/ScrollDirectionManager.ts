export type ScrollDirection = "initial" | "up" | "down";

type ScrollDirectionManagerOptions = {
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
  }: ScrollDirectionManagerOptions) {
    this.scrollPosition = 0;
    if (initialOffset) this.initialOffset = initialOffset;
    this.onDirectionChange = onDirectionChange;
    this.setupSubscriptions();
  }

  private readonly setupSubscriptions = (): void => {
    // Setting up the scroll event listener
    this.scrollListener = this.handleScrollDirection.bind(this);
    window.addEventListener("scroll", this.scrollListener);
  };

  private readonly handleScrollDirection = (): void => {
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

  public dispose(): void {
    // Remove the event listener when disposing
    if (this.scrollListener) {
      window.removeEventListener("scroll", this.scrollListener);
      this.scrollListener = null;
    }
  }
}
