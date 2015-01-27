---
layout: doc
title: delite/CustomElement
---

# delite/CustomElement

`delite/CustomElement` is a base class for non-visual custom elements, such as an element representing a data store.
It also serves as the base class for [delite/Widget](Widget.md).

Behind the scenes, `delite/CustomElement` provides many of the features mentioned in the
[Introduction to delite and custom elements](customElements101.md).  In particular,
it parses attributes in declarative markup, for example converting:

```html
<my-widget numProp="123"></my-widget>
```

into:

```js
myWidget.numProp = 123;
```


The initialization methods in `delite/CustomElement` correspond to the function names from the
Custom Elements specification, specifically `createdCallback()` and `attachedCallback()`.

When a custom element is instantiated via `register.parse()`, `createdCallback()` and `attachedCallback()` are
automatically called.
When a custom element is instantiated programatically, `createdCallback()` is automatically called,
but the application must call `attachedCallback()` manually.
Alternately, if you extend [`delite/Widget`](Widget.md), you can use the `placeAt()`
method, which will attach the element to the specified DOM node and also call `attachedCallback()`.
The requirement to manually call `attachedCallback()` is because, for performance reasons,
delite does not set up document level listeners for DOM nodes being attached / removed from the document.

Also, `delite/CustomElement` does not provide the `attributeChangedCallback()`, but you can
find out when properties change by declaring the properties in your element's prototype, and then reacting to changes
in `refreshRendering()`.

Finally, CustomElement provides common methods like `on()` and `destroy()`, but
it does not provide the [`delite/Widget`](Widget.md) specific lifecycle methods
like `render()` and `postRender()`.