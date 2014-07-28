---
layout: default
title: delite/focus
---

# delite/focus


delite/focus is a utility module that is used to track and manage active widgets on a page.

At any point in time there is a set of (for lack of a better word) "active" or "focused" widgets,
meaning the currently focused widget and that widget's ancestors.
"Ancestor" can mean either DOM ancestor (ex: TextBox → Form), or a logical parent-child relationship
(ex: TooltipDialog → DropDownButton).

For example, if focus is on a TextBox inside a TabContainer inside a TooltipDialog triggered by a DropDownButton,
the stack would be
TextBox → ContentPane → TabContainer → TooltipDialog → DropDownButton.

## on() interface

Call `focus.on("active-widget-stack", callback)` to track the stack of currently focused widgets.

Call `focus.on("widget-blur", func)` or `focus.on("widget-focus", ...)` to monitor when
when widgets become active/inactive.

## _onFocus() and _onBlur()

Also, if `delite/focus` is loaded, each widget's `_onFocus()` and `_onBlur()` method will be called
when that widget becomes active / inactive.


