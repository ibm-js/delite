---
layout: doc
title: delite/on
---

# delite/on

`delite/on` is a general-purpose event handler module for DOM nodes, providing normalized event listening.

The main purpose is to:

1. shim `focusin` and `focusout` on browsers that don't support those events natively
2. shim [Event.key](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key) on browsers that don't
   support it natively, and fix the values on browsers that don't obey the specification

## Usage

The module's return value is a function that can be directly called to add an event listener:

```js
require(["delite/on"], function (on) {
	on(myNode, "click", function (e) {
		// handle the event
	});
});
```


## Removing an Event Handler

The return value of `on()` provides a method that can be used to remove the event listener from the event:

```js
require(["delite/on"], function (on) {
	var signal = on(document, "click", function () {
		// remove listener after first event
		signal.remove();
		// do something else...
	});
});
```
