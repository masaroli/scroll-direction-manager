# ScrollDirectionManager

`scroll-direction-manager` is a lightweight, zero-dependency utility package that simplifies tracking the scroll direction (`"up"`, `"down"`, or `"initial"`) of a web page or scrollable container. It ships with both a framework-agnostic `ScrollDirectionManager` class and a dedicated React hook entry point (`scroll-direction-manager/react`), packaged with dual ESM & CJS builds.

It is particularly useful for responsive navigation bars and sticky headers that hide on scroll down, reappear with a scrolled state on scroll up, and reset when near the top of the page or across SPA route transitions.

## Key Features

- **React Hook (`useScrollDirection`)**: Exposed via `scroll-direction-manager/react` so vanilla projects stay 100% React-free. Returns `{ direction, payload, isUp, isDown, isInitial }` and automatically manages listener lifecycle.
- **SPA-Ready Reset (`reset()` & `resetKey`)**: Easily resync scroll position and reset to `"initial"` on route changes in Next.js or React Router (e.g. `resetKey: pathname`).
- **Scroll Jitter Filtering & iOS Bounce Protection**: Optional `threshold` ignores trackpad/touch micro-bounces, while automatic clamping prevents negative top rubber-banding and bottom overscroll flips on iOS Safari.
- **Custom Scroll Targets**: Track `window` by default, or pass any scrollable `HTMLElement` (or React `RefObject<HTMLElement | null>`) for drawers, modals, and inner scroll panes.
- **Custom Direction Payloads**: Optionally map `"initial"`, `"up"`, and `"down"` to custom values (strings, class names, objects, etc.) delivered to `onDirectionChange(direction, payload)`, `manager.getPayload()`, and `useScrollDirection().payload` with full TypeScript inference.
- **Performance & Dual Packaging**: Uses `{ passive: true }` listeners, optional `requestAnimationFrame` coalescing (`useAnimationFrame: true`), SSR guards (`typeof window !== "undefined"`), and tree-shakeable ESM + CJS builds.

## Installation

```sh
npm install scroll-direction-manager
```

## React Usage

Import the `useScrollDirection` hook from `scroll-direction-manager/react` to declaratively track scroll direction in your React components:

```tsx
"use client";

import { usePathname } from "next/navigation";
import { useScrollDirection } from "scroll-direction-manager/react";

export function Navbar() {
  const pathname = usePathname();
  const { direction, isUp, isDown, isInitial } = useScrollDirection({
    initialOffset: 120,
    threshold: 8,
    resetKey: pathname,
  });

  return (
    <header
      className={[
        "navbar",
        isDown ? "navbar--hidden" : "",
        isUp ? "navbar--scrolled" : "",
        isInitial ? "navbar--top" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-scroll-direction={direction}
    >
      <nav>My Navigation</nav>
    </header>
  );
}
```

### Custom Payloads in React

Map each direction to a custom class name, state label, or config object via `payload`:

```tsx
import { useScrollDirection } from "scroll-direction-manager/react";

export function Navbar() {
  const { direction, payload: stateClass } = useScrollDirection({
    initialOffset: 120,
    payload: {
      initial: "navbar--top",
      up: "navbar--scrolled",
      down: "navbar--hidden",
    },
  });

  return (
    <header className={`navbar ${stateClass}`} data-scroll-direction={direction}>
      <nav>My Navigation</nav>
    </header>
  );
}
```

### Tracking a Scrollable Container (Drawer / Modal)

Pass a React `ref` (or `HTMLElement`) to `target`:

```tsx
import { useRef } from "react";
import { useScrollDirection } from "scroll-direction-manager/react";

export function Drawer() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isDown } = useScrollDirection({
    target: scrollRef,
    initialOffset: 60,
    threshold: 8,
  });

  return (
    <div ref={scrollRef} className="drawer-body">
      <div className={isDown ? "drawer-header--hidden" : "drawer-header"} />
      {/* scrollable content */}
    </div>
  );
}
```

## Vanilla TypeScript / JavaScript Usage

```typescript
import {
  ScrollDirectionManager,
  type ScrollDirection,
} from "scroll-direction-manager";

const element = document.querySelector('[data-element="some-element"]');

const navOnScroll = (direction: ScrollDirection) => {
  if (!element) return;

  if (direction === "initial" || direction === "up") {
    element.classList.remove("hide");

    if (direction === "up") {
      element.classList.add("scrolled");
    } else {
      element.classList.remove("scrolled");
    }
  } else {
    element.classList.add("hide");
  }
};

const scrollDirectionInstance = new ScrollDirectionManager({
  initialOffset: 145,
  threshold: 8,
  useAnimationFrame: true,
  onDirectionChange: navOnScroll,
});

// Resync after an SPA route transition:
// scrollDirectionInstance.reset();

// Clean up when no longer needed:
// scrollDirectionInstance.dispose();
```

### Custom Payloads in Vanilla JS / TS

Pass a `payload` map to receive a strongly typed second argument in `onDirectionChange(direction, payload)` without altering the core `"initial" | "up" | "down"` direction values:

```typescript
import { ScrollDirectionManager } from "scroll-direction-manager";

const element = document.querySelector('[data-element="some-element"]');

const scrollDirectionInstance = new ScrollDirectionManager({
  initialOffset: 145,
  payload: {
    initial: "show",
    up: "show",
    down: "hide",
  },
  onDirectionChange: (direction, action) => {
    if (!element) return;
    element.classList.toggle("hide", action === "hide");
    element.classList.toggle("scrolled", direction === "up");
  },
});

// Read the current mapped payload at any time:
// scrollDirectionInstance.getPayload(); // "show" | "hide"
```

## API Reference

### `useScrollDirection(options?: UseScrollDirectionOptions): UseScrollDirectionResult`

Imported from `"scroll-direction-manager/react"`.

#### Options (`UseScrollDirectionOptions` / `ScrollDirectionManagerOptions`)

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `initialOffset` | `number` | `120` | Scroll threshold in pixels. At or below this offset, direction is always `"initial"`. |
| `threshold` | `number` | `0` | Minimum scroll delta in pixels required before flipping between `"up"` and `"down"` (returning to `"initial"` always fires immediately). Set to `8`–`10` to filter trackpad/touch micro-jitter. |
| `target` | `Window \| HTMLElement \| RefObject<HTMLElement \| null> \| null` | `window` | Scrollable target to observe (`RefObject` supported in `useScrollDirection`). Passing `null` safely skips attaching until non-null. |
| `useAnimationFrame` | `boolean` | `false` | When `true`, coalesces rapid scroll events into at most one DOM read per `requestAnimationFrame` tick. |
| `resetKey` | `unknown` | `undefined` | *(React hook only)* Whenever this value changes (e.g. Next.js `pathname`), resets direction to `"initial"` and resyncs `scrollPosition` to the current scroll offset. |
| `payload` | `Partial<Record<ScrollDirection, T>>` | `undefined` | Optional map associating custom values with `"initial"`, `"up"`, and/or `"down"`. When all three keys are provided, the resolved payload type excludes `undefined`. |
| `onDirectionChange` | `(direction: ScrollDirection, payload: T) => void` | `undefined` | Optional callback invoked whenever the scroll direction changes. Receives `payload` as its second argument when `payload` is configured. |

#### Return Value (`UseScrollDirectionResult`)

| Property | Type | Description |
| --- | --- | --- |
| `direction` | `"initial" \| "up" \| "down"` | Current scroll direction state. |
| `payload` | `ResolvedScrollDirectionPayload<TMap>` | Mapped payload value for the current `direction` (`undefined` if `payload` was not provided or the current direction key was omitted). |
| `isInitial` | `boolean` | `true` when `direction === "initial"` (at or above `initialOffset`). |
| `isUp` | `boolean` | `true` when `direction === "up"` (scrolling up below `initialOffset`). |
| `isDown` | `boolean` | `true` when `direction === "down"` (scrolling down below `initialOffset`). |

### `ScrollDirectionManager`

Imported from `"scroll-direction-manager"`.

- `new ScrollDirectionManager(options?: ScrollDirectionManagerOptions)`: Initializes `scrollPosition` from the target's current scroll offset and starts listening with `{ passive: true }`.
- `getDirection(): ScrollDirection`: Returns the current scroll direction (`"initial" | "up" | "down"`).
- `getPayload(): ResolvedScrollDirectionPayload<TMap>`: Returns the mapped payload for the current scroll direction (or `undefined` when not configured).
- `reset(): void`: Cancels any pending animation frame, resyncs `scrollPosition` to the target's current scroll offset, and resets direction to `"initial"` (notifying `onDirectionChange` if direction changed).
- `dispose(): void`: Cancels any pending animation frame and removes the scroll event listener.

## Notes for AI Agents / LLMs

When integrating or modifying `scroll-direction-manager`, keep these rules in mind:

1. **Entry Points & Named Exports**:
   - React: `import { useScrollDirection } from "scroll-direction-manager/react";`
   - Vanilla JS/TS: `import { ScrollDirectionManager, type ScrollDirection } from "scroll-direction-manager";`
   - Keep React imports isolated to the `/react` subpath so non-React consumers do not need `react` installed.
2. **State Semantics (`"initial"` vs `"up"` vs `"down"`)**:
   - While scroll position `<= initialOffset` (default `120`px), the direction is strictly `"initial"`, even if `threshold > 0` or the user scrolls slightly within that top region.
   - `"down"` and `"up"` are only emitted when scroll position `> initialOffset` and movement reaches `threshold` (default `0`).
   - Top negative rubber-banding and bottom overscroll past `scrollHeight - clientHeight` are clamped automatically.
   - For persistent SPA layouts (Next.js App Router / React Router), pass `resetKey: pathname` (or call `manager.reset()`) so route transitions that jump to `scrollY = 0` do not leave a stale `scrollPosition`.
3. **SSR & Next.js Compatibility**:
   - `ScrollDirectionManager` guards all browser global access (`window`, `document`, `requestAnimationFrame`), making it safe to import on the server.
   - `scroll-direction-manager/react` includes the `"use client";` directive; in Next.js App Router, add `"use client";` at the top of any component file that calls `useScrollDirection`.
4. **Cleanup & Re-renders**:
   - In React, `useScrollDirection` automatically calls `manager.dispose()` on unmount and holds `onDirectionChange` and `payload` in refs so inline callbacks or payload objects do not reset scroll tracking across renders.
   - In Vanilla JS or non-React frameworks, always call `instance.dispose()` during component teardown to prevent memory leaks.
