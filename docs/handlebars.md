---
layout: default
title: delite/handlebars
---

# delite/handlebars

`delite/handlebars` supports reactive templates,
so a template like below would automatically adjust the
DOM as the widget's `iconClass` and `label` properties were changed:

{% raw %}
```html
<button>
	<span class="d-reset {{iconClass}}"></span>
	{{label}}
</button>
```
{% endraw %}

Note that the binding is one-directional.  Changes to DOM node values, such as when a user types
into an `<input>`, are not automatically reflected back to the widget.
A library like [Liaison](https://github.com/ibm-js/liaison) supports two way binding.

The delite/handlebars! plugin lets you put your template in a separate file,
and then define the widget like:

```js
define([..., "delite/handlebars!./templates/MyTemplate.html"], function(..., template){
	...
	template: template,
	...
}
```

Internally, delite/handlebars! compiles the template into an AST format and then uses `delite/template` to generate
the final template object that it returns.

## Bindings

Widgets can contains expressions surrounded by the {% raw %}`{{` and `}}`{% endraw %} symbols.
Expressions can be either:

* widget properties (ex: {% raw %}`{{foo}}`{% endraw %})
* paths to widget properties (ex: {% raw %}`{{item.foo}}`{% endraw %})
* arbitrary javascript code (except for the {% raw %}`{{` and `}}`{% endraw %} tokens themselves)
  referencing widget properties and methods via `this.`, ex: {% raw %}`{{this.selectionMode === "multiple"}}`{% endraw %}

Bindings are supported in attributes (ex: {% raw %}`class="d-reset {{iconClass}}"`{% endraw %})
and as Element children (ex: {% raw %}`<span>Hello {{name}}</span>`{% endraw %}).

Bindings should evaluate to plain text (or a boolean or number), but
not HTML.  Special characters are escaped.  For example, if `name` is `<b>Bob</b>`,
the above template will merely render as `Hello <b>Bob</b>` not as "Hello **Bob**".

### Binding paths

Paths like {% raw %}`{{foo.bar}}`{% endraw %} can be used in templates, but have limitations:

1. If a property inside of `foo` is modified, the application needs to call `this.notifyCurrentValue("foo")`
   manually to make the widget re-render.
2. When a top level property (`foo`) is updated, any part of the template
   referencing `foo` (for example, {% raw %}`{{foo.bar}}`{% endraw %}) will cause a DOM update, even if the value of `foo.bar`
   itself hasn't changed.  This may cause unnecessary browser redraw/recalculation, for example due to
   unnecessarily resetting a node's class.
3. If the last property in a path is undefined or null, an empty string is substituted.  For example, if
   `foo.bar.zaz` is undefined, then {% raw %}`class="{{foo.bar.zaz}}"`{% endraw %} becomes `class=""`.  However, this doesn't
   work if a parent property is null/undefined, i.e. if `foo.bar` is undefined.

### Binding expressions

Expressions are meant for simple calculations inside of templates.
For more complex calculations, we recommend using `computeProperties()` to define new widget properties instead.
Expressions must be valid javascript, using the `this` variable, and quoting strings.
The expression must evaluate to a string, number, or boolean value.  Some examples are:

* {% raw %}``multiple="{{this.selectionMode === 'multiple'}}"``{% endraw %} - sets `multiple` to true or false depending on `selectionMode`
* {% raw %}``class="d-slider {{this.orientation === 'vertical' ? 'd-slider-vertical' : 'd-slider-horizontal'}}`{% endraw %} - sets class
  `d-slider-vertical` or `d-slider-horizontal` depending on value of `this.orientation`

Finally, here's an example of a template using simple widget property bindings,
path bindings, and an expression:

{% raw %}
```html
<template>
{{a}} + {{item.b}} = {{this.a + this.item.b}}
</template>
```
{% endraw %}

### Binding details

Handlebars aims to transparently do the right thing to make binding work automatically.
For example, if a template contains {% raw %}`<input type=checkbox checked={{checked}}>`{% endraw %},
handlebars (or actually [template](./template.md)) knows to set the `checked` property
rather than setting the `checked` attribute, since the latter action doesn't actually change the checked state.

More generally, handlebars directly sets the shadow property rather than the attribute whenever
a shadow property exists.

In cases where there is no shadow property, handlebars converts the value to a string.
For example, in a template with {% raw %}`<div aria-selected={{selected}}>`{% endraw %}, the
`aria-selected` property will be set to the string "true" or "false".  This assumes (i.e. requires)
that the `selected` property in the widget is a strict boolean value,
rather than a falsy value like "" or a true-ish value like "hi".

About undefined substitution variables, imagine that all the bind variables in the following example
are undefined:

{% raw %}
```html
<span class={{myClass}} aria-valuenow={{myValue}}>{{myText}}</span>
```
{% endraw %}

For the `class` attribute and innerHTML, undefined variables are treated like empty strings.
However, for other attributes, `undefined` is a special flag meaning to remove the attribute.
This is necessary especially for ARIA support, where (for example) `aria-valuenow=""` has a different
meaning that having no `aria-valuenow` attribute at all.
See the [ARIA spec](http://www.w3.org/TR/wai-aria/states_and_properties#aria-valuenow) for more details.

So, if all the bind variables in the above example are undefined, it will essentially be rendered as:

```html
<span class=""></span>
```


## Widgets in templates

A template can contain widgets in addition to plain DOM nodes.  In this case, the template
must list the required AMD modules via the `requires` attribute on the root node:

{% raw %}
```html
<template requires="deliteful/Button, deliteful/ProgressIndicator">
	<d-button>{{buttonText}}</d-button>
	<d-progress-indicator value="{{piValue}}"></d-progress-indicator>
</template>
```
{% rendaw %}

This technique can also be used to load other required modules, such as `delite/a11yclick`.

## Hiding and showing nodes in a template

Although we don't support {% raw %}`{{#if}}`{% endraw %}, you can show/hide nodes in a template like:

{% raw %}
```html
<template>
	<div d-hidden="{{myHideFlag}}">...</div>
	<div d-shown="{{myShowFlag}}">...</div>
</template>
```
{% endraw %}

Note that this requires including the common CSS defined by the themes (coming from themes/common/global.less),
so your widget must reference the `delite/theme!` plugin:

```js
define([..., "delite/theme!"], function(...) { ...
```

## Attach points and events

Special attribute names allow setting up references to nodes in the template,
and setting up event handlers on those nodes.

A template like:

{% raw %}
```html
<template>
	<button attach-point="{{focusNode}}" on-click="{{clickHandler}}">click me</button>
</template>
```
{% endraw %}

will set `this.focusNode` to point to the `<button>`, and setup a listener for the "click" event to call
`this.clickHandler`.

## Unsupported constructs

1. Helpers like {% raw %}`{{fullName author}}`{% endraw %}. But plan to support helpers in the future.
2. {% raw %}`{{#if}}` and `{{#each}}`{% endraw %}

Partly these are unsupported because they are difficult for reactive templates,
and partly to keep the code size of the Handlebars and template engine minimal.
