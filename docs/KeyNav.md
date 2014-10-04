---
layout: default
title: delite/KeyNav
---

# delite/KeyNav

This is a base class to enable keyboard navigation between the widget's descendants.
Navigation can be performed via arrow keys and HOME/END keys, and also a letter key search.
A List, Tree, or Grid widget could all be subclasses of KeyNav.

To use this base class, the subclass must implement a number of abstract methods.  For LEFT/RIGHT/UP/DOWN arrow key
navigation, implement:

* onLeftArrow()
* onRightArrow()
* onDownArrow()
* onUpArrow()

These methods are meant to navigate relative to the current node,
so they should operate based on `this.navigatedDescendant`.

In addition, the subclass must:

- Set all descendants' initial tabIndex to "-1"; both initial descendants and any
  descendants added later, by for example `addChild()`.  Exception: if `focusDescendants` is false then the
  descendants shouldn't have any tabIndex at all.
- Define `descendantSelector` to a function or string that identifies focusable child widgets.
- Define `this.containerNode`.

Also, child widgets must implement a `.focus()` method.

## keyHandlers

If a subclass wants to take action on other keystrokes, such as F2, it can augment/redefine the `keyHandlers`
hash, for example:

```js
postRender: function () {
   this.keyHandlers[keys.F2] = this._f2HandlerFunc;
}
```

## Example

<iframe width="100%" height="300" src="http://jsfiddle.net/ibmjs/Lbvu2/embedded/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>