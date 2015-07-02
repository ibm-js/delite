---
layout: doc
title: delite/Widget
---

# delite/Widget

`delite/Widget` is the superclass for all visual widgets.
It provides fine grained lifecycle methods, shorthand notation for declaring custom setters,
and code to read widget parameters specified as DOMNode attributes.

## Lifecycle

Declarative creation:

1. Element upgraded to have all methods and properties of the widget class.
2. Parameters specified as DOMNode attributes (ex: `<d-slider max=10>`) are mixed into the widget, thus calling
   custom setters.
3. `attachedCallback()` callback.
4. `computeProperties()` called with hash of parameters specified as DOMNode attributes.
5. `preRender()` callback executed.
6. `render()` callback executed.  Note though that the root node already exists.
7. `postRender()` callback executed.
8. `refreshRendering(hash, true)` called with hash of parameters specified as DOMNode attributes,
   but with `true` boolean flag to indicate that `render()` was just called.

Programmatic creation is:

1. Element created with widget tag name (ex: `<d-slider>`), and
   upgraded to have all methods and properties of the widget class.
2. Parameters specified programatically
   (ex: `new MyWidget({title: "..."})`) are mixed into the widget, thus calling
   custom setters.
3. `computeProperties()` called with hash of parameters specified as DOMNode attributes.
4. `preRender()` callback executed.
5. `render()` callback executed.   Note though that the root node already exists.
6. `postRender()` callback executed.
7. `refreshRendering(hash, true)` called with hash of parameters specified to widget's constructor,
   but with `true` boolean flag to indicate that `render()` was just called.

`attachedCallback()` will be called automatically, although asynchronously, when the widget is attached to the
document.

There are currently five lifecycle methods which can be extended on the widget:

1. `preRender()`
2. `render()`
3. `postRender()`
4. `attachedCallback()`
5. `detachedCallback()`

Note that all of these methods except `render()` are automatically chained,
so you don't need to worry about setting up code to call the superclasses' methods.

Also, note that widget authors don't typically extend `render()` directly, but rather
specify the `template` property.   See the [`handlebars!`](handlebars.md) documentation for more details.

## Placement

Delite widgets are DOM Custom Elements.  That means they can be placed and manipulated just like other DOM elements.
Any DOM manipulation library should work well with instances of the widgets, but there is a helper function for
placing the widget in the DOM named `.placeAt()`.  This function takes one or two arguments.  The first argument is
node being referenced or the string ID of the node and the second argument is
where the widget should be positioned.

```js
// Place as last child of someNode
mywidget.placeAt("someNode");

// Place as third child of someNode
mywidget.placeAt("someNode", 3);

// Place before someNode
mywidget.placeAt("someNode", "before");
```

## Events

Assigning listeners to widget events is accomplished via the `.on()` method.  This method takes two parameters:

* `type` - The type of event being listened for.  (e.g. `"click"`)
* `listener` - The listener function to be called when the event is detected.

Synthetic events can be emitted on the widget or its sub-nodes via the `.emit()` function.  The function takes two
arguments:

* `type` - The type of the event being emitted. (e.g. `"click"`)
* `event` - Properties to set on the synthetic event object.

## Updating widgets

`delite/Widget` extends [`decor/Invalidating`](/decor/docs/0.5.0/Invalidating.html) and thus uses the same mechanism
for updating the widget DOM according to changes to widget properties.

Specifically, the properties must be declared in the prototype, along with
`computeProperties()` and `refreshRendering()` methods to respond to property changes:

```js
define(["delite/register", "delite/Widget"/*, ...*/], function (register, Widget/*, ...*/) {
  return register("my-widget", [HTMElement, Widget], {
    a: true,
    b: "value",
    computeProperties: function (oldValues) {
      if ("a" in oldValues) {
        // do something logical that does not directly impact the DOM because "a" has changed
        // To access new value, access directly to `this.a`
      }
    },
    refreshRendering: function (oldValues) {
      if ("b" in oldValues) {
        // modify the DOM because "b" has changed
        // To access new value, access directly to `this.b`
      }
      if ("a" in oldValues) {
      }
    }
  });
});
```
