export type ScrollDirection = "initial" | "up" | "down";

export type ScrollDirectionPayloadMap = Readonly<
  Partial<Record<ScrollDirection, unknown>>
>;

export type ResolvedScrollDirectionPayload<TMap> = [TMap] extends [undefined]
  ? undefined
  : TMap extends Readonly<Record<ScrollDirection, infer TValue>>
    ? TValue
    : TMap extends Readonly<Partial<Record<ScrollDirection, infer TValue>>>
      ? TValue | undefined
      : undefined;

export type ScrollDirectionManagerOptions<
  TMap extends ScrollDirectionPayloadMap | undefined = undefined,
> = {
  initialOffset?: number;
  payload?: TMap;
  onDirectionChange?: (
    direction: ScrollDirection,
    payload: ResolvedScrollDirectionPayload<TMap>
  ) => void;
};

export class ScrollDirectionManager<
  TMap extends ScrollDirectionPayloadMap | undefined = undefined,
> {
  private readonly onDirectionChange: ScrollDirectionManagerOptions<TMap>["onDirectionChange"] =
    undefined;
  private readonly payload: TMap | undefined = undefined;
  private scrollPosition: number;
  private scrollDirection: ScrollDirection = "initial";
  private readonly initialOffset: number = 120;

  private scrollListener: EventListener | null = null;

  public constructor({
    initialOffset,
    payload,
    onDirectionChange,
  }: ScrollDirectionManagerOptions<TMap> = {}) {
    this.scrollPosition = 0;
    if (initialOffset !== undefined) this.initialOffset = initialOffset;
    this.payload = payload;
    this.onDirectionChange = onDirectionChange;
    this.setupSubscriptions();
  }

  private readonly setupSubscriptions = (): void => {
    if (typeof window === "undefined") return;

    // Setting up the scroll event listener
    this.scrollListener = this.handleScrollDirection.bind(this);
    window.addEventListener("scroll", this.scrollListener);
  };

  private getPayloadForDirection(
    direction: ScrollDirection
  ): ResolvedScrollDirectionPayload<TMap> {
    return this.payload?.[direction] as ResolvedScrollDirectionPayload<TMap>;
  }

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
      if (this.payload !== undefined) {
        this.onDirectionChange?.(
          direction,
          this.getPayloadForDirection(direction)
        );
      } else {
        (
          this.onDirectionChange as
            | ((direction: ScrollDirection) => void)
            | undefined
        )?.(direction);
      }
    }

    this.scrollPosition = position;
    this.scrollDirection = direction;
  };

  public getDirection(): ScrollDirection {
    return this.scrollDirection;
  }

  public getPayload(): ResolvedScrollDirectionPayload<TMap> {
    return this.getPayloadForDirection(this.scrollDirection);
  }

  public dispose(): void {
    // Remove the event listener when disposing
    if (typeof window !== "undefined" && this.scrollListener) {
      window.removeEventListener("scroll", this.scrollListener);
      this.scrollListener = null;
    }
  }
}
