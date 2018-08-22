---
layout: doc
title: delite/migration
---

# Migrating from dijit and dojox/mobile to delite

## Notes for applications

1. In markup, widgets look like `<d-star-rating foo=bar>` rather than
	`<div data-dojo-type=delite/StarRating data-dojo-props="foo: bar">`.
2. Widgets are parsed automatically without needing a `parseOnLoad:true` flag.  But there's no auto-loading
	or `data-dojo-mixins`.
3. Since each widget defines and loads its own CSS, you don't need to manually include dijit.css or claro.css;
   also, the theme is determined automatically so you don't need to add `class="claro"` to the `<body>` node.
4. In dijit you could alter when the "change" event fired by setting the `intermediateChanges` flag to true or
   false.  In delite, there are two separate events: "input" and "change".  Listen to the "input" event to get
   notifications as the user is changing the value (for example, as the user is dragging the slider), and listen
   to the "change" event to get a notification  when the user has finished changing the value (for example,
   mouseup on a slider).  Also note that the "change" and "input" events only fire when the user changes the
   value, not when the value is changed programatically.

## Notes for widget authors

### dcl()

dojo.declare() is replaced by [dcl()](http://www.dcljs.org/).  Its usage is similar except for super calls.
Rather than using `this.inherited()`, you use dcl.superCall().  So instead of:

```js
_inZeroSettingArea: function(/*Number*/ x, /*Number*/ domNodeWidth){
	if(this.isLeftToRight()){
		return this.inherited(arguments);
	}else{
		return x > (domNodeWidth - this.zeroAreaWidth);
	}
}
```

You would do:

```js
_inZeroSettingArea: dcl.superCall(function(sup){
	return function(/*Number*/ x, /*Number*/ domNodeWidth){
		if(this.effectiveDir === "ltr"){
			return sup.call(this, x, domNodeWidth);
		}else{
			return x > (domNodeWidth - this.zeroAreaWidth);
		}
	};
})
```

Often though it's simpler than this.   Many widget methods are automatically chained.  So a V1 `postCreate()`
method like:

```js
postCreate: function(){
    this.inherited(arguments);
    ... do stuff ...
}
```

can (and should) be replaced by:

```js
postRender: function(){
    ... do stuff ...
}
```

Note also that dcl does have an [this.inherited() type feature](http://www.dcljs.org/docs/inherited_js/).
However, it's not recommended because:

1. `this.inherited()` will run slower than `dcl.superCall()` because it resolves
   at runtime rather than declare time
2. it's easier to step through super calls in the debugger when using `dcl.superCall()`.

### register()

Widgets are declared via `register()` rather than `dojo.declare()`, and must extend `HTMLElement`;
   see the documentation for [register()](register.md) for details

### this

`this` points to the widget's root node.
`this.srcNodeRef` and `this.domNode` both replaced by `this`; for example `this.className = "myButton"`

### lifecycle methods

1. `create()` renamed to `constructor()`
2. `postscript()` no longer runs; `preCreate()` was renamed to `preRender()`.
3. The `buildRendering()` method has been renamed to `render()`.  It must not try to create the root DOMNode; it already
   exists.  It should just set attributes on the root node, and create sub nodes and/or text inside the root node.
   However, usually widgets will not redefine `render()` at all, but rather just define the `template` property.
4. There's no `postMixInProperties()` method any more.  There is one called `preRender()` that
   runs before rendering.
5. `postCreate()` renamed to `postRender()`
6. The widget initialization parameters are not applied until after `render()` and `postRender()` complete.
7. Custom setters still exist, but often its preferable to recompute property values in `computeProperties()` and
   to redraw the widget in `refreshRendering()`.  Both these methods are called asynchronously after a batch of
   property changes.

### templates

`_TemplatedMixin` is replaced by the [handlebars!](handlebars.md) plugin, see that page for details.

### i18n

Resources are loaded through `i18n!` plugin rather than a `loadResource()` type method.

### CSS

A widget should use [delite/theme!](theme.md) or
[requirejs-dplugins/css!](/requirejs-dplugins/docs/0.5.0/css.md) to load its own CSS.

Further, delite/CssState (previously called dijit/_CssStateMixin) no longer sets CSS classes for hover, focus or active,
so the widget CSS should just use the `:focus`, `:hover`, and `:active` pseudo-classes.

### popups / dropdowns

HasDropDown now forwards keystrokes to popups by emitting the "keydown" event on the popup rather than calling
a `handleKey()` method.

Dropdowns should indicate they have executed/canceled by calling `this.emit("execute")`, `this.emit("change")`,
or `this.emit("cancel")`, rather than calling `onExecute()`, `onChange()`, or `onCancel()`.

Dropdowns don't automatically get `overflow: auto` CSS but they should take some measure,
perhaps by extending [`delite/Scrollable`](Scrollable.md), to display a scrollbar when their size
is reduced.

### KeyNav

_KeyNavMixin has been renamed to KeyNav.

The `_keyNavCodes` property has been removed as KeyNav now figures out the method name to call automatically.
However, the method names for arrows have been changed:

- onLeftArrow --> previousKeyHandler
- onRightArrow --> nextKeyHandler
- onDownArrow --> downKeyHandler
- onUpArrow --> upKeyHandler

Methods for handling other keys (like SPACE or ENTER) are similarly named, ex: spaceKeyHandler() and enterKeyHandler().


### onFocus() and onBlur()

delite/activationTracker (previously called dijit/focus) no longer calls `onFocus()` and `onBlur()`
(or `_onFocus()` and `_onBlur()`) methods on a widget.  Rather, it emits `delite-activated` and
`delite-deactivated` events on the widget.

Note that most widgets should probably just call `this.on("focusin", ...)` and `this.on("focusout", ...)`
rather than depending on delite/activationTracker.  It's mainly for popups.

