---
layout: default
title: delite/FormValueWidget
---

# delite/FormValueWidget

`delite/FormValueWidget` is a base class for form widgets that have a value, such as a combobox or slider.

It defines two main methods that the subclass should call:

* `handleOnInput()` - Call this whenever the user changes the value, for example as a slider handle is being dragged.
* `handleOnChange()` - Call this whenever the user "commits" the value change, typically on pointerup or keyup (in the
  slider example, releasing the slider handle).
