---
layout: doc
---

Delite provides a widget infrastructure that fits future standards but is possible
to use on all modern browsers without performance concerns.

Specifically, it's based on the following concepts:

* Custom elements: The node is the widget and the widget is the node.
  By using Custom Elements, the constructor for all widgets is based
  off of the `HTMLElement` DOM object.  This has several advantages, in that as you manipulate the DOM nodes, you are also
  dealing with the widget instances.  This also means there is no widget registry, because the document is effectively the
  registry. You can use whatever DOM manipulation API you want to move the widget around.

* Leverage ES5 accessor properties instead of using the discreet accessors.  This means there is no `widget.get()`
  and `widget.set()`.  You can affect the widget directly.   See the `decor/Stateful` documentation
  for details.

* It directly supports reactive templating via the handlebars! plugin,
  see the [handlebars](handlebars.html) documentation for details

## General documentation

* [Introduction to delite and custom elements](customElements101.html)
* [Delite internal architecture documentation](architecture.html)
* [Migration notes for dijit based applications](migration.html)
* [Notes on theme generation](themes.html)

## Utility modules

* [a11y](a11y.html) - accessibility utility functions
* [a11yclick](a11yclick.html) - allow keyboard "click" (via ENTER or SPACE) on custom DOM nodes
* [css!](css.html) - CSS file loading AMD plugin
* [focus](focus.html) - utility for tracking the stack of "active" widgets; used by [popup](popup.html)
* [handlebars!](handlebars.html) - plugin to compile reactive templates for use in widgets
* [place](place.html) - low level module for placing a popup or dropdown at a certain position
* [popup](popup.html) - popup manager
* [register](register.html) - utility module for declaring new custom element types
* [template](template.html) - code generation library used by [handlebars!](handlebars.html) plugin
* [theme!](theme.html) - CSS loading plugin, like [css!](css.html) but picks the CSS file based on the current theme
* [typematic](typematic.html) - code to repetitively call a user specified callback
  method when a specific key or mouse click over a specific DOM node is held down for a specific amount of time.
* [uacss](uacss.html) - utility to set CSS classes on document root based on the current browser
* [Viewport](Viewport.html) - utility to notify the application when the viewport size is changed, and
  also to get the effective viewport size on mobile devices when the virtual keyboard is displayed

## Base classes

* [Container](Container.html) - base class for widgets that contain a set of element children, such as a Toolbar or
  List widget
* [CustomElement](CustomElement.html) - base class for non-visual widgets, and also the base class for
  [Widget](Widget.html) itself
* [DisplayContainer](DisplayContainer.html) - [Container](Container.html) subclass which adds the ability for
  the container to show/hide its children
* [FormValueWidget](FormValueWidget.html) - base class for form widgets where the user specifies a value, for example
   slider and textbox
* [FormWidget](FormWidget.html) - base class for [FormValueWidget](FormValueWidget.html) and also for form widgets where
  the user *doesn't* specify a value, for example buttons and checkboxes
* [HasDropDown](HasDropDown.html) - base class for widgets that have a drop down, such as a ComboBox
* [KeyNav](KeyNav.html) - base class for widgets with keyboard navigation using arrow keys and also searching by typing
  alphabetic keys; for example, tree and grid widgets
* [Selection](Selection.html) - [Widget](Widget.html) subclass which adds the ability for the widget to manage the
  selection state of its internal items.
* [Store](Store.html) - mixin to query a store object from the
  [dstore](https://github.com/SitePen/dstore/blob/master/README.html) project and
  create render items for this widget based on the store items.
* [StoreMap](StoreMap.html) - extension of [Store](Store.html) that performs some automatic mapping between the properties
  on the store items and the properties on the render items
* [Widget](Widget.html) - base class for visual widgets

