---
layout: doc
title: delite/FormWidget
---

# delite/FormWidget

`delite/FormWidget` is a base class for form widgets,
and predefines properties like `disabled`, `tabindex`, etc.

It's useful for form widgets like buttons and checkboxes.

Note that for form widgets where the user can set the value interactively, via mouse, keyboard, etc.,
they should extend [`delite/FormValueWidget`](FormValueWidget.md) instead.