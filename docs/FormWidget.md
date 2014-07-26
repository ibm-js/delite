---
layout: default
title: delite/FormWidget
---

# delite/FormWidget

`delite/FormWidget` is a base class for form widgets without user settable values,
and predefines properties like `disabled`, `tabindex`, etc.

It's useful for form widgets like buttons and checkboxes.

Note that for form widgets that have a user-settable value, you should subclass
[`delite/FormValueWidget`](FormValueWidget.md) instead.