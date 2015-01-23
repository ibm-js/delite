---
layout: doc
title: delite/FormValueWidget
---

# delite/FormValueWidget

`delite/FormValueWidget` is a base class for form widgets that have a value that the end user can
set interactively, such as a combobox or slider.

## Events

FormValueWidget subclasses should emit `input` and `change` events.
See https://html.spec.whatwg.org/multipage/forms.html#common-input-element-events for details on what these events
mean, and when to emit them.

FormValueWidget defines two methods that the subclass should call to emit these events:

* `handleOnInput()` - Call this whenever the user changes the value, for example as a slider handle is being dragged.
* `handleOnChange()` - Call this whenever the user "commits" the value change, typically on pointerup or keyup (in the
  slider example, releasing the slider handle).

One exception could be widgets that extend or embed native form elements (such as `<select>`),
where the widget leverages the `change` and `input` events emitted naturally by the native form element,
rather than manually emitting synthetic events.  In this case the subclass wouldn't need to call `handleOnInput()`
and `handleOnChange()`.

Conversely, if the FormValueWidget subclass embeds form controls whose `input` and `change` events should be ignored
by the application, then the subclass should call `evt.stopPropagation()`
for those events on the embedded controls.