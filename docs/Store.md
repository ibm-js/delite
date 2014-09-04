---
layout: default
title: delite/Store
---

# delite/Store

`delite/Store` is a mixin that can be mixed into a class inheriting from [`delite/Widget`](Widget.md) or `decor/Evented`
in order to query a store object from the [dstore](https://github.com/SitePen/dstore/blob/master/README.md) project and 
create render items for this widget based on the store items.

This is particularly useful for a widget that needs to create items (or render items) based on store entries
(like a data list, grid or calendar schedule etc...). Using this mixin the widget will benefit from a standard API and
way of doing things.

The store is queried each time one of the following properties is set on the instance:

* store: references a `dstore/api/Store` implementation
* query: a query object to be passed to the store `filter()` function

When the store is queried, render items are created using the `itemToRenderItem()` function which by default just returns the
store item. Render items are typically used in widgets rendering several "data items" (arbitrary number of items
connected to data) to specify how those "data items" have to be rendered. This means the render items are used as input
for the various "data items" rendered in the widget. Depending on the targeted widget, render items expect several
properties to be present like a label, an icon etc. Classes using the mixin might override `itemToRenderItem()` to create
their own render items.

For example the store item (typically coming from a data server) might contain:

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

In addition to this, if the store is an observable store (`dstore/Trackable`) the changes to the data in the store will
be tracked and the following functions will be called on each type of modification:

* `itemRemoved` if an item has been removed
* `itemAdded` if an item has been added
* `itemUpdated` if an item has been updated (its properties have changed)
* `itemMoved` if an item has been moved in an ordered store.

By default those functions update the `renderItems` accordingly.

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
