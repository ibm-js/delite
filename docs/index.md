---
layout: docMain
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
  see the [handlebars](handlebars.md) documentation for details

## General documentation

* [Introduction to delite and custom elements](customElements101.md)
* [Delite internal architecture documentation](architecture.md)
* [Migration notes for dijit based applications](migration.md)
* [Notes on theme generation](themes.md)
* [How to load delite modules](setup.md)
* [Internationalization and localization](g11n.md)

## Utility modules

* [activationTracker](activationTracker.md) - utility for tracking the stack of "active" widgets; used by [popup](popup.md)
* [a11y](a11y.md) - accessibility utility functions
* [a11yclick](a11yclick.md) - allow keyboard "click" (via ENTER or SPACE) on custom DOM nodes
* [handlebars!](handlebars.md) - plugin to compile reactive templates for use in widgets
* [hc!](hc.md) - tests if OS is in high contrast mode
* [on](on.md) - set up event listener on an Element
* [place](place.md) - low level module for placing a popup or dropdown at a certain position
* [popup](popup.md) - popup manager
* [register](register.md) - utility module for declaring new custom element types
* [Template](Template.md) - code generation library used by [handlebars!](handlebars.md) plugin
* [theme!](theme.md) - Plugin loading CSS file based on the current theme
* [uacss](uacss.md) - utility to set CSS classes on document root based on the current browser
* [Viewport](Viewport.md) - utility to notify the application when the viewport size is changed, and
  also to get the effective viewport size on mobile devices when the virtual keyboard is displayed

## Base classes

* [Container](Container.md) - base class for widgets that contain a set of element children, such as a Toolbar or
  List widget
* [CustomElement](CustomElement.md) - base class for non-visual widgets, and also the base class for
  [Widget](Widget.md) itself
* [DisplayContainer](DisplayContainer.md) - [Container](Container.md) subclass which adds the ability for
  the container to show/hide its children
* [FormValueWidget](FormValueWidget.md) - base class for form widgets where the user specifies a value, for example
   slider and textbox
* [FormWidget](FormWidget.md) - base class for [FormValueWidget](FormValueWidget.md) and also for form widgets where
  the user *doesn't* specify a value, for example buttons and checkboxes
* [HasDropDown](HasDropDown.md) - base class for widgets that have a drop down, such as a ComboBox
* [KeyNav](KeyNav.md) - base class for widgets with keyboard navigation using arrow keys and also searching by typing
  alphabetic keys; for example, tree and grid widgets
* [Scrollable](Scrollable.md) - [Widget](Widget.md) subclass which adds scrolling capabilities
  based on the [`overflow: auto`](http://www.w3.org/TR/CSS2/visufx.html#overflow) CSS property.
* [Selection](Selection.md) - [Widget](Widget.md) subclass which adds the ability for the widget to manage the
  selection state of its internal items.
* [Store](Store.md) - mixin to query a store object from the
  [dstore](https://github.com/SitePen/dstore/blob/master/README.md) project and
  create render items for this widget based on the source items.
* [StoreMap](StoreMap.md) - extension of [Store](Store.md) that performs some automatic mapping between the properties
  on the source items and the properties on the render items
* [Widget](Widget.md) - base class for visual widgets

