---
layout: default
title: delite/template
---

# delite/template

`delite/template` is a utility that takes an AST representing a widget template, and compiles it into
a function for creating a reactive template.  It's used by [delite/handlerbars!](handlebars.html) and designed
so it can be used with other template syntax parsers too.

An AST would look like:

```js
{
	tag: "BUTTON",
	attributes: {},
	children: [
		{
			tag: "SPAN",
			attributes: {
				class: {expr: "'d-reset' + this.baseClass", dependsOn: ["baseClass"]}
			},
			connect: {
				click: "myClickHandler"		// name of method in widget to call on click event
			},
			attachPoints: [ "focusNode" ],
			children: [ ... ]
		},
		{expr: "'some boilerplate text' + this.label", dependsOn: ["label"]}
	]
}
```
