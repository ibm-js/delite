---
layout: doc
title: delite/Template
---

# delite/Template

`delite/Template` is a utility class that's constructed from an AST representing a widget template, and compiles it into
a function for creating a reactive template.  It's used by [delite/handlerbars!](handlebars.md) and designed
so it can be used with other template syntax parsers too, or used directly if templates are written in JSON.

## AST

The AST is a tree of javascript objects where each object represents a DOM Element (aka tag) or plain text.

An object representing a DOM Element will look like:

```js
{
	tag: "BUTTON",

	// hash mapping attribute name to attribute value
	attributes: {
		class: "..."
	},

	// hash mapping event name to handler method
	connect: {
		click: "myClickHandler"		// name of method in widget to call on click event
	},

	// array listing property (or properties) on widget to point to this DOM node
	attachPoints: [
		"focusNode"		// set this.focusNode to point to this DOM node
	],

	// children nodes to create under this node
	children: [
		...
	]
}
```

The children of an Element are other Elements, or plain text (see next section).

All properties except for `tag` are optional.

Note that the widget root node itself already exists, and is not created by the template.
However, the template can still set attributes and event listeners on the root node.

## Binding text

There are two cases where a template represents text in the DOM:

1. values for DOM node attributes
2. values for text embedded within a tag

In both cases, the text value is represented as a string.
However, that string is not a simple string like "hello world", but rather a javascript expression,
for example `this.label`.

Thus, to represent boilerplate text, you would write a string that contains a string, like:

```js
"'hello world'"
```

(Note the single quotes inside the double quotes.)


## Example AST

Here's a full example:

```js
{
	// attributes to set on widget root node
	attributes: {
		class: "'d-reset' + this.baseClass"		// javascript expression where this refers to widget
	},

	// children nodes to create under widget root node
	children: [
		// child Element (aka tag)
		{
			tag: "SPAN",
			connect: {
				click: "myClickHandler"		// name of method in widget to call on click event
			},
			attachPoints: [ "focusNode" ],	// set this.focusNode to point to this DOM node
			children: [ ... ]
		},

		// plain text bound to javascript expression where "this" refers to the widget
		"'some boilerplate text ' + this.label"
	]
}
```

In handlebars syntax this would be:

```html
<template class="d-reset {{baseClass}}">
   <span on-click="myClickHandler" attach-point="focusNode">...</span>
   some boilerplate text {{label}}
</template>
```

Note that `label` is escaped, so it cannot contain any HTML.