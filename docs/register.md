---
layout: doc
title: delite/register
---

# delite/register

**register** is a utility module for defining custom elements.

## Usage

You declare a new widget that is based off a DOM object that either is
`HTMLElement` or implements `HTMLElement`, and also extends [`delite/CustomElement`](CustomElement.md) directly or indirectly.
Typically you will extend [`delite/Widget`](Widget.md) or a subclass of [`delite/Widget`](Widget.md) rather than extending
[`delite/CustomElement`](CustomElement.md) directly.

To register the most basic of widgets, you would do the following:

```js
require(["delite/register", "delite/Widget"], function (register, Widget) {
	var MyWidget = register("my-widget", [HTMLElement, Widget], {
		foo: "bar"
	});
});
```

You can instantiate the widget programatically:

```js
var mywidget1 = new MyWidget();
```

or using the custom tag in your HTML:

```html
<my-widget></my-widget>
```

You can think of `register` as a combination of a class declaration system (internally it uses [dcl](http://dcljs.org),
and [customElements.define](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements)
from the custom elements standards.


`register()` takes three arguments:

* `tag` - Is a string that provides the custom element tag name which can be used to instantiate the widget.  The string
  should be unique and should contain at least one dash (`-`).  If there is already a widget
  registered with that tag name, `.register()` will throw an exception.

* `extensions...` - An array of constructor functions which are used
  to create the prototype of the widget class.  They are mixed in left to right.  The first
  class/constructor function must have `HTMLElement` in its prototype chain.  This serves as the
  foundation for the widget.   Widget should typically be directly or indirectly pulled in too.

* `props` - A set of properties for the widget

## Extensions

As mentioned above, the first extension must be a class/constructor function that has `HTMLElement` in its prototype
chain.  This will serve as the base element for the custom element that is part of your widget.  `HTMLElement` has an
interface that is roughly equivalent to the `<div>` tag and is the ancestor of all the HTML* DOM Elements.

You can also extend other widgets, but not base classes like [`delite/Widget`](Widget.md) that don't have `HTMLElement` in their
prototype chain.  If you are subclassing another widget, you should just use that as the base instead of one of the
`HTML*` elements.  For example, to create your own subclass of `deliteful/Button`:

```js
require(["delite/register", "deliteful/Button"], function (register, Button) {
	var MyButtonSubClass = register("my-button-subclass", Button, {
		foo: "bar"
	});
});
```

And instantiate programatically:

```js
var mybutton1 = new MyButtonSubClass();
```

or declaratively via HTML using the `is` attribute:

```html
<my-button-subclass></my-button-subclass>
```

## Standards

`register()` tries to conform to the custom elements standard.
Internally, it calls `customElements.define()`, and if that method
isn't defined by the browser, then it loads the
[webcomponentjs/custom-elements](https://github.com/webcomponents/custom-elements)
polyfill.

