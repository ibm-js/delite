---
layout: doc
title: Delite Architecture - Fast, Small, and Scalable
---

# Delite Architecture - Fast, Small, and Scalable

## Performance and Browser support

Some of the Web Components specifications are not easy to implement in the browser while both keeping high standards
for performance and providing support for a relatively wide range of browsers (think Android stock browser or IE9 for
example that have not yet disappeared and are thus important to take into account).
Some projects like Polymer have decided to implement the entire standard set at all cost.
On our side we decided to concentrate on what we consider the two most important pieces of Web Components, namely,
the custom elements and template specifications.

More specifically, delite follows two design principles related to performance:

* download size - The amount of time a page takes to display is proportional to the amount of code downloaded
  to the browser, especially on slow networks like 3G.  Code bloat also increases the amount of time the browser
  spends parsing and running the javascript.  Therefore, we don't spend bytes on corner case features.

* execution speed - Many Custom Element features can be shimmed, but at a cost.  Delite is designed to run quickly
  even on a page with thousands of DOM nodes.  A good example would be a page with charts, where the chart is composed
  of many SVG nodes.  This shouldn't degrade performance.


For these reasons, at least for now, we do not leverage specifications like Shadow DOM for which the trade-off between
implementation and runtime cost vs. benefit is not obvious.
In the long run, when Shadow DOM will be natively implemented we will probably leverage it,
however in the short term we figured out we would get better results without it.

That said, even though we do provide our own small custom element shim for best performance/code size vs. feature ratio,
when Polymer or native implementation is available we do rely on them to provide the feature and for this
reason you will get full interoperability.


## JavaScript vs HTML centric ecosystem

While Web Components through the HTML import specification favor HTML-centric elements,
where the HTML template is the core of the component, surrounded by CSS and JavaScript logic,
on our side we do favor a slightly different approach where the JavaScript logic is at the core of the element,
and depends on the HTML template and CSS. We think this approach has several advantages including:

* from an MVC perspective, makes the Controller (the element's javascript) the central piece, while the View (HTML, CSS)
  is plugged into the element and can possibly differ while the JavaScript logic stays identical.
* having ability to leverage RequireJS, the widely adopted AMD loader to benefit from an ecosystem of plugins allowing
  you to extend what your Web Component can consume in terms of dependencies as well as benefit from a full–fledged
  build system to easily create single file download for your element.

## Advanced features

Finally, while Web Components are definitely enough to build a UI element from scratch,
when looking into building enterprise class components you might want to abstract yourself a little bit from the
low-level Web Components specifications and build on top of a set of higher level interfaces that provide you with the
services you are looking for, rather than redesigning them each time you build a new element.

For this reason, delite provides a set of features on top of standards that make easier
for you to build advanced UI elements.
Typical examples are JavaScript AMD modules for managing your element selection state,
access to data or form value.
We also provide theming management, allowing your element to automatically
switch CSS theming based on its runtime environment.


## Custom Element performance specifics

Custom Elements extend [`decor/Stateful`](/decor/docs/0.5.0/Stateful.html).
See the decor [design documentation](/decor/docs/0.5.0/architecture.html) for details about how that class avoids
polling / dirty checking for property changes.

Although we set up page level listeners for custom elements being attached/detached from the document, the listeners are
disabled as widgets are being instantiated.  This prevents a performance issue for widgets that internally
create lots of elements, like charts.
Therefore, custom elements that create other custom elements are responsible for creating those
custom elements via javascript (`new MyWidget(...)`), and then calling `attachedCallback()` at the appropriate time.
Note however that this is handled automatically for widgets in templates.

Another decision was to not shim shadow DOM.  While shadow DOM a nice concept, it takes lots of code to shim,
and we felt the download cost outweighed the benefit.

## register() implementation details

delite/register shims custom element support in a manner similar to Polymer.

If the browser supports `document.registerElement()`, then delite/register just uses that.

Otherwise:

1. If the element doesn't already exist it's created via `document.createElement()`.
   This will create an element with the right tag name (ex: `<d-star-rating>`) but
   without any of the behaviors associated with that widget.

2. It calls the `upgrade()` method that converts the plain element
   into a "widget" by adding all the methods and properties of the widget.

On most platforms upgrading is done by "prototype swizzling",
i.e. swapping the element's prototype with the widget's prototype:

```js
element.__proto__ = widget.prototype;
```

That's why the widget's prototype must extend `HTMLElement` or something
similar like `HTMLButtonElement`.

On IE, it's not possible to swizzle the prototype, so `upgrade()` calls
`Object.defineProperties()` to manually adjust every property that the widget
has added or overridden (compared to a plain Element):

```js
Object.defineProperties(element, widget.props)
```

Note that `widget.props`, along with some other metadata, is (pre)computed
when the widget is registered, so it's not possible to dynamically add properties
to the widget.


## Templates

Delite's template engine (handlebars!) is designed to be small and fast.

There are two approaches to instantiating a template:

* create each node programatically and chain them together programatically, i.e. use
  `document.createElement()` or `register.createElement()`, `Element#setAttribute()`, direct property setting,
  `Element#appendChild()`, etc.
* clone a DOM tree and then scan the cloned tree setting up event handlers, attach points, resolve
  bind variables, instantiate widgets in the template, etc.

Delite uses the first technique, in order to avoid having to scan the cloned tree to setup event handlers etc.
It also avoids some tricky issues where widgets in the template instantiate automatically on  browsers with native
`document.registerElement()` support.

`delite/handlebars!` converts HTML text into an intermediate AST representation of the DOM, and
then `delite/template` uses code generation to convert that intermediate form into two javascript functions:
one to create the initial DOM, and the other to reflect widget property updates into the generated DOM.

The generated code to build the initial DOM will look like:

```js
function(register){
	var c1 = register.createElement('span');
	this.setOrRemoveAttribute(c1, 'class', 'd-reset ' + (this.iconClass || ''));
	this.appendChild(c1);
	var c2t2 = document.createTextNode('\n\t' + (this.label || '') + '\n');
	this.appendChild(c2t2);
}
```

and the generated code to reflect widget property updates to the DOM will look like:

```js
function(props){
	if('iconClass' in props)
		this.setOrRemoveAttribute(c1, 'class', 'd-reset ' + (this.iconClass || ''));
	if('label' in props)
		c2t2.nodeValue = '\n\t' + (this.label || '') + '\n';
}
```

The advantages of using code generation rather than building from an AST are:

* running the generated code is 3x faster
* in a build, there's no library code needed besides the generated code
* allows for the template to embed arbitrary javascript without needing our own javascript parser
  (essentially a subset of Esprima), and without needing to call `eval` at runtime

Also, note that template binding is one-directional, from the widget to the DOM node.
This is because proper two way binding takes a lot of code, particularly for corner cases
like how clicking one radio button unchecks the previously selected radio button (but without
any onchange event).

