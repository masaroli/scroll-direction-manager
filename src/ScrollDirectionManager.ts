import { addEventListener } from "seng-disposable-event-listener";
import { DisposableManager } from "seng-disposable-manager";

export type ScrollDirection = "initial" | "up" | "down";

type ScrollDirectionManagerOptions = {
  initialOffset?: number;
  onDirectionChange?: (direction: ScrollDirection) => void;
};

/**
 * @example
 * const scrollDirection = new ScrollDirection({
 *   onDirectionChange: (direction) => {
 *     if (direction === "up") // do something if its up
 *     else if (direction === "initial") // do if its initial
 *   },
 *    treshold: 30
 * })
 */

export class ScrollDirectionManager {
  private readonly onDirectionChange: ScrollDirectionManagerOptions["onDirectionChange"] =
    undefined;
  private scrollPosition: number;
  private scrollDirection: ScrollDirection = "initial";
  private readonly initialOffset: number = 120;
  private readonly disposables = new DisposableManager();

  public constructor({ initialOffset, onDirectionChange }: ScrollDirectionManagerOptions) {
    this.scrollPosition = 0;
    if (initialOffset) this.initialOffset = initialOffset;
    this.onDirectionChange = onDirectionChange;
    this.setupSubscriptions();
  }

  private readonly setupSubscriptions = (): void => {
    this.disposables.add(addEventListener(window, "scroll", this.handleScrollDirection));
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
    this.disposables.dispose();
  }
}
