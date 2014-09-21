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

## delite-activate and delite-deactivate events

Also, if `delite/focus` is loaded, every widget will emit a non-bubbling `delite-activate` event
when it becomes activate (i.e. when it or logical descendant widget is focused or touched), and a non-bubbling
`delite-deactivate` event when the opposite happens.


