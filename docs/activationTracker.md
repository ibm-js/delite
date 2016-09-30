---
layout: doc
title: delite/activationTracker
---

# delite/activationTracker

delite/activationTracker is a utility module that is used to track and manage active nodes on a page.

At any point in time there is a set of (for lack of a better word) "active" or "focused" nodes,
meaning the currently focused node and that node's ancestors.
"Ancestor" can mean either DOM ancestor (ex: TextBox → Form), or a logical parent-child relationship
(ex: TooltipDialog → DropDownButton).

For example, if activationTracker is on a TextBox inside a TabContainer inside a TooltipDialog
triggered by a DropDownButton, the stack would be
TextBox → ContentPane → TabContainer → TooltipDialog → DropDownButton,
plus some intermediate plain (i.e. non-custom-element) nodes.

## on() interface

Call `activationTracker.on("active-stack", callback)` to track the stack of currently focused widgets.

Call `activationTracker.on("deactivated", func)` or `activationTracker.on("activated", ...)` to monitor when
when widgets become active/inactive.

## delite-activated and delite-deactivated events

Also, if `delite/activationTracker` is loaded, every node will emit a non-bubbling `delite-activated` event
when it becomes active (i.e. when it or logical descendant node is focused or clicked), and a non-bubbling
`delite-deactivated` event when the opposite happens.


