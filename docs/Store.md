---
layout: doc
title: delite/Store
---

# delite/Store

`delite/Store` is a mixin that can be mixed into a class inheriting from [`delite/Widget`](Widget.md) or `decor/Evented`
in order to query a store object from the [dstore](http://dstorejs.io/) project or an array and create render items for this
widget based on the store or the array items.

This is particularly useful for a widget that needs to create items (or render items) based on store entries
(like a data list, grid or calendar schedule etc...). Using this mixin the widget will benefit from a standard API and
way of doing things.

The store is queried each time one of the following properties is set on the instance:

* source: references a `dstore/api/Store` implementation or an array or decor/ObservableArray
* query: a query object to be passed to the store `filter()` function or the array `filter()` function

## Create render items from the source items

When the source is queried, render items are created using the `itemToRenderItem()` function which by default just returns the
source item. Render items are typically used in widgets rendering several "data items" (arbitrary number of items
connected to data) to specify how those "data items" have to be rendered. This means the render items are used as input
for the various "data items" rendered in the widget. Depending on the targeted widget, render items expect several
properties to be present like a label, an icon etc. Classes using the mixin might override `itemToRenderItem()` to create
their own render items.

For example the source item (typically coming from a data server) might contain:

```js
{
    lastName: "Smith"
    firstName: "John",
    department: "marketing",
    title: "head of department",
    jobDescription: "in charge of defining the marketing strategy for the company"
}
```

while the widget render item requires and contains exactly what the widget needs to consume, in this case for example:

```js
{
    name: "John Smith"
    jobtitle: "head of department"
}
```

The `itemToRenderItem()` function is in charge of doing that transformation. Alternatively one can use the 
[`delite/StoreMap`](StoreMap.md) mixin which adds mapping functionality to the store mixin and automatically creates the 
render items using this mapping.

Once created the render items array is passed into the `initItems()` function and by default store in the
`renderItems` property.

## Observability/Trackability

In addition to this, the source can be observable.
There are various possibilities to make the source observable.

#### Observable source with `dstore/Trackable` in source property

The first one is to use a `dstore/Trackable` in the source.
By using that, the changes to the data in the source will be tracked and the following functions will be called on each
type of modification:

* `itemRemoved` if an item has been removed
* `itemAdded` if an item has been added
* `itemUpdated` if an item has been updated (its properties have changed)
* `itemMoved` if an item has been moved in an ordered store

By default those functions update the `renderItems` accordingly.

#### Observable source with an array in source property

The way to make the source observable with an array is to use a observable array with observable objects as items
in the source.
If the browser used has implemented the Array.observe() and the Object.observe() function of EC7, then the array is
automatically observable and the items too.
If not, the solution is to implement the array with `decor/ObservableArray` and the items with `decor/Observable`.

By using that, the changes to the data in the source will be tracked and the following functions will be called on each
type of modification:

* `itemRemoved` if an item has been removed
* `itemAdded` if an item has been added
* `itemUpdated` if an item has been updated (its properties have changed)

Note : For browsers without implementation of the observe function : if the source is a `decor/ObservableArray` but is not
using `decor/Observable` objects as item, the function itemUpdated will not be called, but itemAdded and itemRemoved will.
Inversely if the source is a simple array but using `decor/Observable` objects, only the function itemUpdated will be
called.

By default those functions update the `renderItems` accordingly.

## Leveraging the work of `delite/Store`

Classes extending the mixin have two ways of leveraging the work of `delite/Store`. They can either listen to the changes
to the `renderItems` property or redefine the various functions of the mixin to be notified of changes made to the render
items.

Listening to changes of `renderItems` is best done via the `refreshRendering()` method:

```js
define(["delite/register", "delite/Widget", "delite/Store"/*, ...*/], 
  function (register, Widget, Store/*, ...*/) {
  return register("employees-list", [HTMElement, Widget, Store], {
   	itemToRenderItem: function (item) {
   	   return {
   	     name: item.firstName + " " + item.lastName,
   	     jobtitle: item.title
   	   }
	},
    refreshRendering: function (props) {
       if ("renderItem" in props) {
         // render item has changed, do something to reflect that in the rendering by adding for example
         // a DOM element per item using the properties on the render item 
       }
    }
  });
});
```
