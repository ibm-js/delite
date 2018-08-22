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
Custom Elements specification, specifically `constructor()` and `connectedCallback()`.

Finally, CustomElement provides common methods like `on()` and `destroy()`, but
it does not provide the [`delite/Widget`](Widget.md) specific lifecycle methods
like `render()` and `postRender()`.
