# delite/handlebars

`delite/handlebars` supports reactive templates,
so a template like below would automatically adjust the
DOM as the widget's `iconClass` and `label` properties were changed:

	<button>
		<span class="d-reset {{iconClass}}"></span>
		{{label}}
	</button>


Note that the binding is one-directional.  Changes to DOM node values, such as when a user types
into an `<input>`, are not automatically reflected back to the widget.
A library like [Liaison](https://github.com/ibm-js/liaison) supports two way binding.

The delite/handlebars! plugin returns a function to operate in the widget's context, so
for widgets to leverage the template engine, you put your template in a separate file,
and then define the widget like:

	define([..., "delite/handlebars!./templates/MyTemplate.html"], function(..., renderFunc){
		...
		buildRendering: renderFunc,
		...
	}

Handlebars can also be used as a plain AMD module, via the `compile()` method:

	define([..., "delite/handlebars"], function(..., handlebars){
		...
		buildRendering: handlebars.compile(
			'<span class="d-reset {{iconClass}}">{{label}}</span>'
		),
		...
	}

## Substitution variables

Substitution variables are supported in attributes (ex: `class="d-reset {{iconClass}}"`)
and as Element children (ex: `<span>Hello {{name}}</span>`).

Special characters are escaped.  For example, if `name` is `<b>Bob</b>`,
the above template will render as `Hello <b>Bob</b>` not as "Hello **Bob**".
In other words, there's no support for `{{{name}}}`, only support for `{{name}}`.

Paths like `{{foo.bar}}` can be used in templates, but are not recommended.
The limitations of using paths are:

1. The widget will only re-render when `foo` itself is updated, not when just `foo.bar` is updated.
   You can currently trick the widget into thinking that `foo` was updated by doing `this.foo = this.foo`;
   in the future the API to do this will be changed to `this.notifyCurrentValue("foo")`.
2. When a top level property (`foo`) is updated, any part of the template
   referencing `foo` (for example, `{{foo.bar}}`) will cause a DOM update, even if the value of `foo.bar`
   itself hasn't changed. This may cause unnecessary browser redraw/recalculation, for example due to
   unnecessarily resetting a node's class.
3. If the last property in a path is undefined or null, an empty string is substituted.  For example, if
   `foo.bar.zaz` is undefined, then `class="{{foo.bar.zaz}}"` becomes `class=""`.  However, this doesn't
   work if a parent property is null/undefined, i.e. if `foo.bar` is undefined.


## Widgets in templates

A template can contain widgets in addition to plain DOM nodes.  In this case, the template
must list the required AMD modules via the `data-requires` attribute on the root node:

	<template data-requires="deliteful/Button, deliteful/ProgressIndicator">
		<d-button>{{buttonText}}</d-button>
		<d-progress-indicator value={{piValue}}></d-progress-indicator>
	</template>

This technique can also be used to load other required modules, such as `delite/a11yclick`.

## Hiding and showing nodes in a template

Although we don't support `{{#if}}`, you can show/hide nodes in a template like:

	<template>
		<div d-hidden="{{myHideFlag}}">...</div>
		<div d-shown="{{myShowFlag}}">...</div>
	</template>

Note that this requires including the common CSS defined by the themes (coming from themes/common/global.less),
so your widget must reference the `delite/theme!` plugin:

	define([..., "delite/theme!"], function(...) { ...

## Attach points and events

Special attribute names allow setting up references to nodes in the template,
and setting up event handlers on those nodes.

A template like:

	<template>
		<button data-attach-point=focusNode on-click={{clickHandler}}>click me</button>
	</template>

will set `this.focusNode` to point to the `<button>`, and setup a listener for the "click" event to call
`this.clickHandler`.

## Unsupported constructs

1. Helpers like `{{fullName author}}`. But plan to support helpers in the future.
2. `{{#if}}` and `{{#each}}`

Partly these are unsupported because they are difficult for reactive templates,
and partly to keep the code size of the Handlebars and template engine minimal.

## Implementation details

delite/handlebars! compiles the template into an AST format and then uses `delite/template` to generate
a function from it.


## Notes on template format

There were a number of possible syntaxes proposed for the templates, including:

* [MDV](http://www.polymer-project.org/platform/template.html) -
  Pure HTML version of templates, possibly will become a new standard, supported natively by browsers
* [Mustache](http://mustache.github.io/mustache.5.html) / [Handlebars](http://handlebarsjs.com/) -
  What our users are used to.  Note that the Mustache and Handlebars syntaxes are the same except
  for complicated things like branching/looping.
* [JADE](http://jade-lang.com/)-like syntax based on Kris' put-selector code

The JADE like syntax is probably the easiest to write, and the MDV syntax fits the best within the HTML
paradigm, but initially I just programmed a subset of the Handlebars syntax because it's what our users
are used to.   However, given the separation between delite/handlebars and delite/template, any number of template
engines could be easily written.
