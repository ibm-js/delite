---
layout: doc
title: delite/CssState
---

# delite/CssState

`delite/CssState` is a base class for widgets that sets CSS classes on the root node depending on the widget's
semantic state (checked, selected, disabled, etc.).

CssState will, for example, set class my-checkbox-checked if the widget is checked.
It will also set my-checkbox-disabled (if the widget is disabled).

The CSS classes it sets are:

* `this.disabled` --> `d-disabled`
* `this.readOnly` --> `d-readonly`
* `this.selected` --> `d-selected` (ex: currently selected tab)
* `this.checked == true` --> `d-checked` (ex: a checkbox or a ToggleButton in a checked state)
* `this.checked == "mixed"` --> `d-mixed` (half-checked aka indeterminate checkbox)
* `this.state == "Error"` --> `d-error` (ValidationTextBox value is invalid)
* `this.state == "Incomplete"` --> `d-incomplete` (user hasn't finished typing value yet)

## Usage

To use this base class in custom widgets, just make it [one of] the widget's superclasses:
    
```js
define(["delite/register", "delite/CssState"], function(register, CssState){
	register("my-slider", [HTMLElement, CssState], {
		...
	}
});
```

Then CSS classes will automatically be applied to the widget's root node.