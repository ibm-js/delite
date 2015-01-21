---
layout: default
title: delite/Template
---

# delite/Template

`delite/Template` is a utility class that's constructed from an AST representing a widget template, and compiles it into
a function for creating a reactive template.  It's used by [delite/handlerbars!](handlebars.md) and designed
so it can be used with other template syntax parsers too.

An AST would look like:

```js
{
	tag: "BUTTON",
	children: [
		// child Element (aka tag)
		{
			tag: "SPAN",
			attributes: {
				class: "'d-reset' + this.baseClass"		// javascript expression where this refers to widget
			},
			connect: {
				click: "myClickHandler"		// name of method in widget to call on click event
			},
			attachPoints: [ "focusNode" ],	// set this.focusNode to point to this DOM node
			children: [ ... ]
		},

		// plain text bound to javascript expression where "this" refers to the widget
		"'some boilerplate text' + this.label"
	]
}
```

In handlebars syntax this would be:

```html
<button>
   <span class="d-reset {{baseClass}}"> on-click="myClickHandler" attach-point="focusNode">...</span>
   some boilerplate text {{label}}
</button>
```

Note that `label` is escaped, so it cannot contain any HTML.