---
layout: doc
title: delite/ViewPort
---

# delite/ViewPort

**delite/Viewport** provides a few viewport related utilities:

* `Viewport.on("resize", myCallback)` will notify of viewport resizes while eliminating spurious resize events,
  i.e. events where the size hasn't really changed.  TODO: This was an issue on IE but check if it's still an issue
  on IE9+

* Viewport.getEffectiveBox() returns the size of the viewport not including the virtual keyboard (if a
  virtual keyboard is being shown); useful for widgets like ComboBox which display a drop down while focused on
  an `<input>`