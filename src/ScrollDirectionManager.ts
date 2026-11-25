export type ScrollDirection = "initial" | "up" | "down";

export type ScrollTarget = Window | HTMLElement;

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
  threshold?: number;
  target?: ScrollTarget | null;
  useAnimationFrame?: boolean;
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
  private readonly initialOffset: number = 120;
  private readonly threshold: number = 0;
  private readonly useAnimationFrame: boolean = false;
  private readonly target: ScrollTarget | null = null;

  private scrollPosition: number = 0;
  private scrollDirection: ScrollDirection = "initial";
  private scrollListener: EventListener | null = null;
  private rafId: number | null = null;

  public constructor({
    initialOffset,
    threshold,
    target,
    useAnimationFrame,
    payload,
    onDirectionChange,
  }: ScrollDirectionManagerOptions<TMap> = {}) {
    if (initialOffset !== undefined) this.initialOffset = initialOffset;
    if (threshold !== undefined) this.threshold = Math.max(0, threshold);
    if (useAnimationFrame !== undefined) {
      this.useAnimationFrame = useAnimationFrame;
    }

    if (target !== undefined) {
      this.target = target;
    } else if (typeof window !== "undefined") {
      this.target = window;
    }

    this.payload = payload;
    this.onDirectionChange = onDirectionChange;
    this.scrollPosition = this.getScrollPosition();
    this.setupSubscriptions();
  }

  private isElementTarget(
    target: ScrollTarget | null
  ): target is HTMLElement {
    return target !== null && "scrollTop" in target;
  }

  private getMaxScrollPosition(): number | null {
    if (!this.target) return null;

    if (this.isElementTarget(this.target)) {
      const { scrollHeight, clientHeight } = this.target;
      if (scrollHeight > clientHeight && clientHeight > 0) {
        return scrollHeight - clientHeight;
      }
      return null;
    }

    if (typeof document === "undefined") return null;

    const viewportHeight = this.target.innerHeight;
    const docHeight = Math.max(
      document.documentElement?.scrollHeight ?? 0,
      document.body?.scrollHeight ?? 0
    );

    if (docHeight > viewportHeight && viewportHeight > 0) {
      return docHeight - viewportHeight;
    }

    return null;
  }

  private getScrollPosition(): number {
    if (!this.target) return 0;

    const rawPosition = this.isElementTarget(this.target)
      ? this.target.scrollTop
      : this.target.scrollY ?? this.target.pageYOffset ?? 0;

    let position = Math.max(0, rawPosition);
    const maxScroll = this.getMaxScrollPosition();

    if (maxScroll !== null) {
      position = Math.min(position, maxScroll);
    }

    return position;
  }

  private cancelScheduledFrame(): void {
    if (this.rafId !== null) {
      if (typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(this.rafId);
      }
      this.rafId = null;
    }
  }

  private readonly setupSubscriptions = (): void => {
    if (!this.target) return;

    this.scrollListener = this.onScrollEvent.bind(this);
    this.target.addEventListener("scroll", this.scrollListener, {
      passive: true,
    });
  };

  private readonly onScrollEvent = (): void => {
    if (
      this.useAnimationFrame &&
      typeof requestAnimationFrame === "function"
    ) {
      if (this.rafId !== null) return;
      this.rafId = requestAnimationFrame(() => {
        this.rafId = null;
        this.handleScrollDirection();
      });
      return;
    }

    this.handleScrollDirection();
  };

  private getPayloadForDirection(
    direction: ScrollDirection
  ): ResolvedScrollDirectionPayload<TMap> {
    return this.payload?.[direction] as ResolvedScrollDirectionPayload<TMap>;
  }

  private notifyDirectionChange(direction: ScrollDirection): void {
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

  private readonly handleScrollDirection = (): void => {
    if (!this.target) return;

    const position = this.getScrollPosition();
    let direction: ScrollDirection = "initial";

    if (position > this.initialOffset) {
      const delta = position - this.scrollPosition;
      if (delta === 0) return;
      if (this.threshold > 0 && Math.abs(delta) < this.threshold) return;

      direction = delta < 0 ? "up" : "down";
    }

    const previousDirection = this.scrollDirection;
    this.scrollPosition = position;
    this.scrollDirection = direction;

    if (direction !== previousDirection) {
      this.notifyDirectionChange(direction);
    }
  };

  public getDirection(): ScrollDirection {
    return this.scrollDirection;
  }

  public getPayload(): ResolvedScrollDirectionPayload<TMap> {
    return this.getPayloadForDirection(this.scrollDirection);
  }

  public reset(): void {
    this.cancelScheduledFrame();
    const previousDirection = this.scrollDirection;
    this.scrollPosition = this.getScrollPosition();
    this.scrollDirection = "initial";

    if (previousDirection !== "initial") {
      this.notifyDirectionChange("initial");
    }
  }

  public dispose(): void {
    this.cancelScheduledFrame();

    if (this.target && this.scrollListener) {
      this.target.removeEventListener("scroll", this.scrollListener);
      this.scrollListener = null;
    }
  }
}
