---
layout: doc
title: delite/Scrollable
---

# delite/Scrollable

`delite/Scrollable` is a `delite/Widget` subclass which adds to the widget
scrolling capabilities based on the [`overflow: auto`](http://www.w3.org/TR/CSS2/visufx.html#overflow) 
CSS property.

##### Table of Contents
[Extending Scrollable](#extending)  
[Using Scrollable](#using)  
[Element Styling](#styling)  
[User Interactions](#interactions)  
[Events](#events)  
[Enterprise Use](#enterprise)

<a name="extending"></a>
## Extending Scrollable

By default, the scrolling capabilities are added to the widget's root node
(that is, the widget itself). The host widget can chose the node thanks to the property
`scrollableNode`. This property must be set by the subclass at latest in its `render()`
method.

*First use-case: creating a widget extending `delite/Scrollable`*

```js
define(["delite/register", "delite/Scrollable", ...],
  function (register, Scrollable, ...) {
    return register("mywidget", [HTMLElement, Scrollable, ...], {
      ...
      render: dcl.superCall(function (sup) {
        return function () {
          // Create a child element:
          var myScrollableDiv = document.createElement("div");
          ...
          this.appendChild(myScrollableDiv);
          // Indicate the scrollable child element:
          this.scrollableNode = myScrollableDiv; 
          sup.apply(this, arguments);
        };
      })
});
```

Characteristics:

- Fits for widgets with one single scrollable element.
- Exposes the API of delite/Scrollable.

*Second use-case: creating a widget embedding widgets extending `delite/Scrollable`*

```js
define(["delite/register", "delite/Scrollable", ...],
  function (register, Scrollable, ...) {
    // In this use-case, does not extend delite/Scrollable
    return register("mywidget", [HTMLElement, ...], {
      ...
      render: dcl.superCall(function (sup) {
        return function () {
          var scrollableNode =
            new ScrollableWidget(...); // a widget extending delite/Scrollable
          ...
          this.appendChild(scrollableNode);
          // If needed, add other scrollable widgets as child elements
          sup.apply(this, arguments);
        };
      })
});
```

Characteristics:

- Allows a widget to have more than one scrollable element.
- Allows to hide the API of delite/Scrollable.

<a name="using"></a>
## Using Scrollable

### Scroll Direction

A widget extending `delite/Scrollable` can choose among several scrolling modes
through the `scrollDirection` property:

* `"horizontal"`: horizontal scrolling only.
* `"vertical"`: vertical scrolling only.
* `"both"`: horizontal and vertical scrolling.
* `"none"`: no scrolling on any direction.

### Programmatic Scroll

In additional to the interactive scroll, the API of `delite/Scrollable` provides methods 
for programmatic scroll:
* `scrollBy(by, duration)`: scrolls by the given amount.
* `scrollTo(to, duration)`: scrolls to the given position.

The arguments `by` and `to` must be an object with x and/or y properties, for example
`{x: 0, y: -5}` or `{y: -29}`, representing the desired amount of scroll, respectively
scroll position. 

The `duration` argument of both methods is optional. It represents the duration of the scrolling 
animation in milliseconds. If 0 or unspecified, the scrolling is performed without animation.

The method `getCurrentScroll()` returns the current amount of scroll, as an object 
with x and y properties for the horizontal and vertical scroll amount. This is a convenience
method and it is not supposed to be overridden.

The following methods return `true` if the scroll has reached the maximum limit at the 
top, bottom, left, or right limit of the scrollable content: `isTopScroll()`, `isBottomScroll()`,
`isLeftScroll()`, and `isRightScroll()`.


<a name="events"></a>
## Element Events

During interactive or programmatic scrolling, native "scroll" events are emitted,
and can be listen as follows (here, `scrollWidget` is the widget into which this 
mixin is mixed):

```js
scrollWidget.on("scroll", function (event) {
  ...
}
```

For widgets that customize the `scrollableNode` property, the events should be 
listen as follows:

```js
scrollWidget.on("scroll", 
  function () {
    ...
  }, scrollWidget.scrollableNode);
```

At the beginning and at the end of a scrolling, a native "scroll" event is emmitted. 
"scroll" events can also be emitted during the scrolling. Note that, for performance reasons,
mobile browsers typically suppress the events during the momentum phase of scrolling.


<a name="styling"></a>
## Element Styling

Style is defined by the CSS classes from the themes of the widget. CSS classes are bound to the
structure of the widget as follows:

|CSS class name|Applies to|
|----------|----------|
|d-scrollable|The `scrollableNode` element (by default the root widget node|
|d-scrollable-h|Applied to `scrollableNode` if the property `scrollDirection` is `"horizontal"` or `"both"`|
|d-scrollable-v|Applied to `scrollableNode` if the property `scrollDirection` is `"vertical"` or `"both"`|

The following CSS layout attributes must not be changed: `overflow`, `overflow-x`, `overflow-y`.


<a name="interactions"></a>
## User Interactions

The scrolling interaction is handled natively by the browser in a multi-channel 
responsive manner: touch scrolling gesture on touch-enabled devices and 
mouse/keyboard-driven scrollbars on touchless desktop browsers.

During interactive or programmatic scrolling, native "scroll" events are emitted, 
and can be listened to as follows (here, `scrollWidget` is the widget into which 
this mixin is mixed):

```js
scrollWidget.on("scroll", function () {
  ...
}
```

For widgets that customize the `scrollableNode` property, the events should be listened 
to on `widget.scrollableNode`:

```js
scrollWidget.scrollableNode.on("scroll", function () {
  ...
}
```

Note that mobile browsers may not emit "scroll" events during the momentum phase of 
the scroll.

<a name="enterprise"></a>
## Enterprise Use

### Accessibility

Keyboard accessibility is supported. All supported desktop browsers provide keyboard accessibility
for elements using the 
[`overflow: auto`](http://www.w3.org/TR/CSS2/visufx.html#overflow) CSS property.

Screen reader accessibility relies on screen reader's ability to work with HTML elements using the 
[`overflow: auto`](http://www.w3.org/TR/CSS2/visufx.html#overflow) CSS property.

### Globalization

`delite/Scrollable` does not provide any internationalizable bundle. The only strings displayed 
by the widget are coming from the elements added by user as scrollable content of this widget.

Right to left orientation is supported by setting the `dir` attribute to `rtl` on the
widget using `delite/Scrollable`.

### Security

This class has no specific security concern.

### Browser Support

This class supports all supported browsers.

