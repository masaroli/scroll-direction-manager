# ScrollDirectionManager

The ScrollDirectionManager is a utility package that simplifies tracking the scroll direction (up, down, or initial) of a web page. It provides an easy-to-use class that manages the scroll event listener and calculates the current scroll direction based on the scroll position and an optional initial offset.

This package is particularly useful when building responsive user interfaces that need to adapt or perform specific actions based on the user's scroll behavior. For example, you could use it to show or hide a sticky header, control the visibility of scroll-to-top buttons, or trigger animations based on the scroll direction.

## Key Features

- **Scroll Direction Detection**: Accurately determines the current scroll direction (up, down, or initial) based on the scroll position and an optional initial offset.
- **Callback Function**: Allows you to pass a callback function that gets called whenever the scroll direction changes, enabling you to update your UI or perform custom logic accordingly.
- **Customizable Initial Offset**: Allows you to set a custom initial offset value to adjust the sensitivity of the scroll direction detection.
- **Lightweight and Easy to Use**: Designed with a simple and intuitive API, making it easy to integrate into your projects.

## Installation

Install the package via npm:

```sh
npm install scroll-direction-manager
```

## Usage

Basic example of use:

```typescript
import ScrollDirectionManager from 'scroll-direction-manager';
import type ScrollDirection from 'scroll-direction-manager';

let element = document.querySelector('[data-element="some-element"]');

let scrollDirectionInstance = new ScrollDirectionManager({
        initialOffset: 145,
        onDirectionChange: navOnScroll,
      });

function navOnScroll(direction: ScrollDirection) => {
    if (element) {
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
    }
};
```
