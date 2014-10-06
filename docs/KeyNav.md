---
layout: default
title: delite/KeyNav
---

# delite/KeyNav

This is a base class to enable keyboard navigation between the widget's descendants.
Navigation can be performed via arrow keys and HOME/END keys, and also a letter key search.
A List, Tree, or Grid widget could all be subclasses of KeyNav.

## Keystroke Handlers

To use this base class, the subclass should implement methods for the keystrokes that it wants to handle.
For LEFT/RIGHT/UP/DOWN arrow key navigation, implement:

* previousArrowKeyHandler(event, currentDescendant)
* nextArrowKeyHandler(event, currentDescendant)
* downArrowKeyHandler(event, currentDescendant)
* upArrowKeyHandler(event, currentDescendant)

The subclass can implement methods for other keys too, following the naming pattern above, for example
spaceKeyHandler(), f2KeyHandler(), etc.

If a handler is defined, then `KeyNav` automatically calls `evt.preventDefault()` and `evt.stopPropagation()`.

## Other Requirements

In addition to setting up keystroke handler methods, the subclass must:

- Set all descendants' initial tabIndex to "-1"; both initial descendants and any
  descendants added later, by for example `addChild()`.  Exception: if `focusDescendants` is false then the
  descendants shouldn't have any tabIndex at all.
- Define `descendantSelector` to a function or string that identifies focusable child widgets.
- Define `this.containerNode`.

Also, child widgets must implement a `.focus()` method.

## Example

<iframe width="100%" height="300" src="http://jsfiddle.net/ibmjs/Lbvu2/embedded/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>