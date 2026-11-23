# ScrollDirectionManager

`scroll-direction-manager` is a lightweight, zero-dependency utility package that simplifies tracking the scroll direction (`"up"`, `"down"`, or `"initial"`) of a web page. It ships with both a framework-agnostic `ScrollDirectionManager` class and a first-class React hook (`useScrollDirection`).

It is particularly useful for responsive navigation bars and sticky headers that hide on scroll down, reappear with a scrolled state on scroll up, and reset when near the top of the page.

## Key Features

- **React Hook (`useScrollDirection`)**: Returns `{ direction, isUp, isDown, isInitial }` and automatically manages listener lifecycle.
- **Scroll Direction Detection**: Accurately determines the current scroll direction (`"up"`, `"down"`, or `"initial"`) based on `window.scrollY` and an optional `initialOffset` threshold.
- **Callback Support**: Pass an optional `onDirectionChange` callback that fires only when the scroll direction state transitions.
- **Zero External Runtime Dependencies**: Uses native browser event listeners with SSR safety (`typeof window !== "undefined"`).

## Installation

```sh
npm install scroll-direction-manager
```

## React Usage

Use the `useScrollDirection` hook to declaratively track scroll direction in your React components:

```tsx
import { useScrollDirection } from "scroll-direction-manager";

export function Navbar() {
  const { direction, isUp, isDown, isInitial } = useScrollDirection({
    initialOffset: 120,
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
  onDirectionChange: navOnScroll,
});

// Clean up when no longer needed:
// scrollDirectionInstance.dispose();
```

## API Reference

### `useScrollDirection(options?: UseScrollDirectionOptions): UseScrollDirectionResult`

#### Options (`UseScrollDirectionOptions` / `ScrollDirectionManagerOptions`)

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `initialOffset` | `number` | `120` | Scroll threshold in pixels (`window.scrollY`). At or below this offset, direction is always `"initial"`. |
| `onDirectionChange` | `(direction: ScrollDirection) => void` | `undefined` | Optional callback invoked whenever the scroll direction changes. |

#### Return Value (`UseScrollDirectionResult`)

| Property | Type | Description |
| --- | --- | --- |
| `direction` | `"initial" \| "up" \| "down"` | Current scroll direction state. |
| `isInitial` | `boolean` | `true` when `direction === "initial"` (at or above `initialOffset`). |
| `isUp` | `boolean` | `true` when `direction === "up"` (scrolling up below `initialOffset`). |
| `isDown` | `boolean` | `true` when `direction === "down"` (scrolling down below `initialOffset`). |

### `ScrollDirectionManager`

- `new ScrollDirectionManager(options?: ScrollDirectionManagerOptions)`: Starts listening to `window` scroll events.
- `getDirection(): ScrollDirection`: Returns the current scroll direction (`"initial" | "up" | "down"`).
- `dispose(): void`: Removes the `window` scroll event listener.

## Notes for AI Agents / LLMs

When integrating or modifying `scroll-direction-manager`, keep these rules in mind:

1. **Named Exports Only**: Always import via named exports from the root package:
   - React: `import { useScrollDirection } from "scroll-direction-manager";`
   - Vanilla JS/TS: `import { ScrollDirectionManager, type ScrollDirection } from "scroll-direction-manager";`
2. **State Semantics (`"initial"` vs `"up"` vs `"down"`)**:
   - While `window.scrollY <= initialOffset` (default `120`px), the direction is strictly `"initial"`, even if the user scrolls slightly down or up within that top region.
   - `"down"` and `"up"` are only emitted when `window.scrollY > initialOffset`.
   - For sticky headers/navbars: show the header in its default/transparent style when `isInitial` (`direction === "initial"`), hide it when `isDown` (`direction === "down"`), and show it with an elevated/compact backdrop when `isUp` (`direction === "up"`).
3. **SSR & Next.js Compatibility**:
   - `ScrollDirectionManager` guards all `window` access with `typeof window !== "undefined"`, making it safe to import on the server.
   - In Next.js App Router, add `"use client";` at the top of any component file that calls `useScrollDirection`.
4. **Cleanup & Re-renders**:
   - In React, `useScrollDirection` automatically calls `manager.dispose()` on unmount and holds `onDirectionChange` in a ref so inline callbacks do not reset scroll tracking across renders.
   - In Vanilla JS or non-React frameworks, always call `instance.dispose()` during component teardown to prevent memory leaks.
