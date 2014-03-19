---
layout: default
title: delite/Store
---

# delite/Store

`delite/Store` is a mixin that can be mixed into a class inheriting from [`delite/Widget`](Widget.md) or `dojo/Evented`  
in order to query a store object from the [dstore](https://github.com/SitePen/dstore/blob/master/README.md) project and 
create render items for this widget based on the store items.

This is particularly useful for a widget that needs to create items (or render items) based on store entries
(like a data list, grid or calendar schedule etc...),  Using this mixin the widget will benefit from a standard will 
benefit from a standard API and way of doing things.

The querying of the store happens each time one of the following properties is set on the instance:
  * store: references a `dstore/api/Store` implementation
  * query: a query object to be passe to the store `filter()` function
  * processStore: a `Function` that allows one to process the store once the filter query has been run. 
   
When the store is queried, render items are created using the `itemToRenderItem()` which by default just returns the 
store item. Classes using the mixin might override this to create there own render items. Alternatively one can use the
[`delite/StoreMap`](StoreMap.md) mixin which is adding mapping functionalities to the store mixin. Once created the
render items array is passed into the `initItems()` function and by default store in the `renderItems` property.

In addition to this, if the store is an obserable store (`dstore/Observable`) the changes to the data in the store will
be tracked and the following functions will be called on each type of modification:
  * `itemRemoved` if an item has been removed
  * `itemAdded` if an item has been added
  * `itemUpdated` if an item has been updated (its properties have changed)
  * `itemMoved` if an item has been moved in an ordered store.
By default those functions are updating the `renderItems` accordingly.

The classes using the mixin has two ways of leveraging the work of `delite/Store`. It can either listen to the changes
to the `renderItems` property or redefine the various functions of the mixin to be notified of changes made to the render
items.

Listening to changes of `renderItems` is best done by adding the `renderItems` property as a property triggering 
invalidation using [`delite/Invalidating`](Invalidating.md). This can be done as follows:

```js
define(["delite/register", "delite/Widget", "delite/Store"/*, ...*/], 
  function (register, Widget, Store/*, ...*/) {
  return register("my-widget", [HTMElement, Widget, Store], {
    preCreate: function () {
       this.addInvalidatingProperties("renderItems");
    }
    refreshRendering: function (props) {
       if (props.renderItems) {
         // render item has changed, do something to reflect that in the rendering
       }
    }
  });
});
```
