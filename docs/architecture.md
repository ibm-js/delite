---
layout: doc
title: Delite Architecture - Fast, Small, and Scalable
---

# Delite Architecture

Delite is designed to be a fast and small framework for build enterprise level custom elements.

It leverages the browser's native support of custom elements (or a polyfill on IE and Edge),
and adds value on top of that.

Delite is built around AMD for file structure, and DCL for class/custom element declarations.
It works with ES5 rather than transpiled ES6.

## Advanced features

While Web Components are definitely enough to build a UI element from scratch,
when looking into building enterprise class components you might want to abstract yourself a little bit from the
low-level Web Components specifications and build on top of a set of higher level interfaces that provide you with the
services you are looking for, rather than redesigning them each time you build a new element.

For this reason, delite provides a set of features on top of standards that make easier
for you to build advanced UI elements.
Typical examples are JavaScript AMD modules for managing your element selection state,
access to data or form value.
We also provide theming management, allowing your element to automatically
switch CSS theming based on its runtime environment.


## Templates

Delite's template engine (handlebars!) is designed to be small and fast.

There are two approaches to instantiating a template:

* create each node programatically and chain them together programatically, i.e. use
  `document.createElement()`, `Element#setAttribute()`, direct property setting,
  `Element#appendChild()`, etc.
* clone a DOM tree and then scan the cloned tree setting up event handlers, attach points, resolve
  bind variables, instantiate widgets in the template, etc.

Delite uses the first technique, in order to avoid having to scan the cloned tree to setup event handlers etc.
It also avoids some tricky issues where widgets in the template instantiate automatically on  browsers with native
custom element support.

`delite/handlebars!` converts HTML text into an intermediate AST representation of the DOM, and
then `delite/template` uses code generation to convert that intermediate form into two javascript functions:
one to create the initial DOM, and the other to reflect widget property updates into the generated DOM.

The generated code to build the initial DOM will look like:

```js
function(register){
	var c1 = document.createElement('span');
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
* allows for the template to embed arbitrary javascript without needing our own javascript parser
  (essentially a subset of Esprima), and without needing to call `eval` at runtime

Also, note that template binding is one-directional, from the widget to the DOM node.
This is because proper two way binding takes a lot of code, particularly for corner cases
like how clicking one radio button unchecks the previously selected radio button (but without
any onchange event).

## Historical Notes

Delite was originally designed to be a faster and smaller alternative to Polymer, that also supported some older
browsers that Polymer didn't, such as IE9 and old versions of Android.

Plus, it was designed to leave in a javascript-centric universe rather than HTML-centric (i.e. HTML Imports).

In the years that have passed, these distinctions have become less important:

* IE9 is desupported by Microsoft.  Only IE11 and Edge are important now.
* Polymer gave up on HTML Imports and moved to the javascript-centric ES6 class system.
* Polymer replaced the heavy (and imperfect) shadow-DOM polyfill with something lighterweight called "shady DOM".

