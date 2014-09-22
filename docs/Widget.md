---
layout: default
title: delite/Widget
---

# delite/Widget

`delite/Widget` is a mixin used by all widgets.
It provides fine grained lifecycle methods, shorthand notation for declaring custom setters,
and code to read widget parameters specified as DOMNode attributes.

## Lifecycle

Declarative creation:

1. Element upgraded to have all methods and properties of the widget class.
2. `preRender()` callback executed.
3. `render()` callback executed.   Note though that the root node already exists.
4. `postRender()` callback.
5. Parameters specified as DOMNode attributes (ex: `<d-slider max=10>`) are mixed into the widget, thus calling
   custom setters.
6. `startup()` callback.

Programmatic creation is:

1. Element created with widget tag name (ex: `<d-slider>`), and
   upgraded to have all methods and properties of the widget class.
2. `preRender()` callback executed.
3. `render()` callback executed.   Note though that the root node already exists.
4. `postRender()` callback.
5. Parameters specified programatically
   (ex: `new MyWidget({title: "..."})`) are mixed into the widget, thus calling
   custom setters.
6. `startup()` callback.

`startup()` will be called automatically in the declarative case, but
if the widget was created programatically, the app must manually call `startup()`
on the widget or its ancestor after inserting the widget into the document.

As mentioned above, there are currently five lifecycle methods which can be extended on the widget:

1. `preRender()`
2. `render()`
3. `postRender()`
4. `startup()`
5. `destroy()`

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

## Custom setters

Note that custom setters need to call `this._set()` to record the new value:

```js
_setLabelAttr: function(val){
	this._set("label", val);	// to notify listeners and record the new value
	this.labelNode.textContent = val;	// update the DOM
}
```
