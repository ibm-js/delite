---
layout: doc
title: Delite and Custom Elements
---

# Delite and Custom Elements

The heart of delite is its support for custom elements.
In a nutshell, this means that an app has the ability to define new tags (often called widgets),
for example `<my-combobox>`, which can be used interchangeably with the native HTML tags like `<input>`.

Delite's support of custom elements is mainly split across four components:

* [register](register.md) - utility for defining new custom elements
* [Widget](Widget.md) - base class for all widgets
* [handlebars!](handlebars.md) - AMD plugin to compile templates
* [theme!](theme.md) - AMD plugin to load CSS for this widget for the current theme


## Defining Custom Elements

Custom Elements are defined using [register()](register.md).
The [register()](register.md) method is
as a combination of a class declaration system (internally it uses [dcl](http://dcljs.org),
and [customElements.define](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements)
from the custom elements standards.
it calls `customElements.define()`, and if that method
If `customElements.define()` isn't defined by the browser, then it loads the
[webcomponentjs/custom-elements](https://github.com/webcomponents/custom-elements)
polyfill.


When defining a custom element you generally:

* Define which HTML class you are extending.  Currently only `HTMLElement` is supported.
* Define a template.
* Define CSS for your custom element, preferably one CSS file for each supported theme.
* Define the public properties of your custom elements.

There are other optional steps, like defining methods and emitting custom events, but those are the most basic steps.

Example:

{% raw %}
```js
define([
	"delite/register",
	"delite/Widget",
	"delite/handlebars!./MyWidget/MyWidget.html",				// the template
	"delite/theme!./MyWidget/themes/{{theme}}/MyWidget.css"		// the CSS
], function (register, Widget, template) {
	MyWidget = register(
		"my-widget",				// the custom tag name
		[HTMLElement, Widget],		// the superclasses
		{
			// my template
			template: template

			// my public properties
			stringProp: "",
			numProp: 123,
			boolProp: true,
			objProp: null
		}
	);
});
```
{% endraw %}

The template (MyWidget.html) will be something like:

{% raw %}
```html
<template>
	Hello {{stringProp}}!  You have {{numProp}} messages and
	{{this.boolProp ? "no" : "some"}} calendar events.
</template>
```
{% endraw %}

It is discussed in detail in [handlebars!](handlebars.md).


## Instantiating Custom Elements Declaratively

Like native elements, custom elements can be instantiated declaratively.
Given a custom element definition like above, you would declare an instance like:

```html
<my-widget stringProp="hi" numProp="456" boolProp="false"
	objProp="myGlobalVariable"></my-widget>
```

Note that delite does automatic type conversion from the attribute value (which is always a string)
to the property's type.

### Parsing

"Parsing" refers to scanning the document for custom element usages (ex: `<my-widget></my-widget>`), and upgrading
those plain HTML elements to be proper custom elements (i.e. setting up the prototype chain, and calling
`constructor()` and `connectedCallback()`).

When the document has finished loading, delite will do an initial parse.
Afterwards, if new custom elements are defined, delite will scan the document for any additional nodes that need to
be upgraded.

So, custom elements will be instantiated without any guaranteed order, and without any guaranteed timing relative to
other javascript code running.
Therefore, if your custom elements depend on a global variable, like in the example above,
you should make sure it is available before the custom element is loaded.  So you may need code like this:

```js
require(["dstore/Memory"], function (Memory) {
	myGlobalVar = new Memory();
	require(["deliteful/List"]);
});
```
### Declarative Events

Like native elements, custom elements' main notification mechanism is emitting events.
Declarative markup has a special syntax for listening to events, both natural events
and synthetic ones:

```html
<my-widget on-click="console.log(event);"
	on-element-selected="console.log(event);"></my-widget>
```

The example above is listening for a click event as well as a synthetic "element-selected" event.

Note how there is a convenience `event` parameter available to be referenced in the inlined code.

Of course, you can also use `Element.addEventListener()`, but this syntax is often convenient.

## Creating Custom Elements Programatically

Custom elements can be created programatically the way that plain javascript objects are instantiated:

```js
var myWidgetInstance = new MyWidget({
	stringProp: "hi",
	numProp: 456,
	boolProp: false,
	objProp: myGlobalVariable
});
```

Custom elements can also be created programatically just like native elements:

```js
var myWidgetInstance = document.createElement("my-widget");
myWidgetInstance.stringProp = "hi";
myWidgetInstance.numProp = 456;
myWidgetInstance.boolProp = false;
myWidgetInstance.objProp = myGlobalVariable;
```

Note that:

* We are setting properties, not attributes.
* We are using the correct types, not setting the properties to string values.

During creation you also typically set up event handlers, like:


```js
myWidgetInstance.on("click", myCallback1);
myWidgetInstance.on("selection-change", myCallback2);
```

Finally, use `placeAt()` to insert the element into the DOM:

```js
myWidget.placeAt(document.body);
```
